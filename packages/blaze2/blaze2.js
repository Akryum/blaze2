console.warn('This package is experimental. Use at your own risks.');

import { Meteor } from 'meteor/meteor';
import Vue from 'vue';
import VueMeteor from 'vue-meteor-tracker';

// Meteor tracker for Vue
Vue.use(VueMeteor, {
  // Use Object.freeze() on the Tracker results
  // This disable Vue reactivity setup
  // and gives us a performance boost
  // since we can consider Tracker as the
  freeze: true,
});

// Global objects
export const Blaze = {};
export const Template = {};

// Override vue options hooks
function overrideHookForTemplate(base, name, callback, options = {}) {
  const originalCb = base[name];
  base[name] = function() {

    // Object binded to callback 'this'
    let bindTo;
    if(!options.bindComponent && this._state) {
      bindTo = this._state;
    } else {
      bindTo = this;
    }

    // Original Callback
    if(originalCb) {
      originalCb.bind(bindTo)();
    }

    // Callback
    if(options.nextTick) {
      this.$nextTick(callback.bind(bindTo));
    } else {
      callback.bind(bindTo)();
    }
  };
}

// Define reactive variables on a Vue component instance
Vue.prototype.defineReactive = function(map) {
  for(const k in map) {
    Vue.util.defineReactive(this, k, map[k]);
  }
};

// Override vue instanciation
const _init = Vue.prototype._init;
Vue.prototype._init = function(options) {

  // Private object that will be binded to Blaze callbacks
  this._state = {
    $state: this,
    defineState: this.defineReactive.bind(this),
    ...options.methods,
  };

  _init.bind(this)(options);
};

// Add the root Vue component to the page
// (after Meteor startup and one tick later)
Blaze.registerRootComponent = function(options) {
  Meteor.startup(() => {
    Meteor.defer(() => {
      const div = document.createElement('div');
      div.setAttribute('id', 'app');
      document.body.appendChild(div);
      new Vue(options).$mount('#app');
    });
  });
};

// Register a Blaze template
Blaze.registerTemplate = function(name, def) {
  const options = def.options;

  Template[name] = {
    name,
    componentDefinition: options,
    // Hooks
    onCreated(callback) {
      overrideHookForTemplate(options, 'beforeCreate', callback);
    },
    onRendered(callback) {
      // We need to override both 'mounted' and 'updated'
      overrideHookForTemplate(options, 'mounted', callback, {
        // The DOM will be ready one tick later
        nextTick: true,
      });
      overrideHookForTemplate(options, 'updated', callback, {
        // The DOM will be ready one tick later
        nextTick: true,
      });
    },
    onDestroyed(callback) {
      overrideHookForTemplate(options, 'destroyed', callback);
    },
    // Options
    subscribe(map) {
      if(!options.meteor) {
        options.meteor = {};
      }
      if(!options.meteor.subscribe) {
        options.meteor.subscribe = {};
      }
      for(const k in map) {
        let option = map[k];
        let result = option;
        if(typeof result === 'function') {
          result = function() {
            return option.bind(this._state)();
          };
        }
        options.meteor.subscribe[k] = result;
      }
    },
    helpers(map) {
      // TODO Need to hybrid computed and tracker options
      if(!options.meteor) {
        options.meteor = {};
      }
      if(!options.computed) {
        options.computed = {};
      }
      for(const k in map) {
        let option = map[k];
        let result = option;
        if(option.get || option.set) {
          options.computed[k] = result;
        } else {
          if(typeof result === 'function') {
            result = function() {
              return option.bind(this._state)();
            };
          }
          options.meteor[k] = result;
        }
      }
    },
    events(map) {
      // TODO events
      for(const k in map) {
        const index = k.indexOf(' ');
        const event = k.substr(0, index);
        const selector = k.substr(index + 1);
      }
      console.warn('Template.<name>.events() is not implemented yet.');
    },
    methods(map) {
      for(const k in map) {
        if(!options.methods) {
          options.methods = {};
        }
        options.methods[k] = function(...args) {
          return map[k].bind(this._state)(...args);
        };
      }
    },
  };

  Meteor.startup(() => {
    Vue.component(name, options);
  });
};
