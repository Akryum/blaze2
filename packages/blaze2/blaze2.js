console.warn('[blaze2] This package is experimental. Use at your own risks.');

import { Meteor } from 'meteor/meteor';
import Vue from 'vue';
import VueMeteor from 'vue-meteor-tracker';
import './unique-id';

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
    if(!options.bindComponent && this._template) {
      bindTo = this._template;
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

// Events handling in vue component
function initBlazeEvents() {
  if(this.$options._events) {
    this._blazeEventHandlers = {};
  }
}
function updateBlazeEvents() {
  if(this.$options._events) {
    this.$nextTick(() => {
      for(const option of this.$options._events) {
        // Callback
        const callback = (event) => {
          // TODO data context
          console.warn(`[blaze2] Inside events map, 'this' (the data context) is not implemented.`);
          option.callback.bind(null)(event, this._template);
        }

        // DOM elements selector
        let els;
        if(!option.selector) {
          els = [this.$el];
        } else {
          els = this.$el.querySelectorAll(option.selector);
        }

        // Events
        const events = option.event.split(',');
        for(const event of events) {

          let cache = this._blazeEventHandlers[event];
          if(!cache) {
            cache = this._blazeEventHandlers[event] = {};
          }

          // Matched DOM elements
          for(const el of els) {
            const uid = el.uniqueID;
            if(!cache[uid]) {
              el.addEventListener(event, callback);
              cache[uid] = true;

              // Clean event listener if DOM element destroyed
              el.addEventListener('DOMNodeRemoved', e => {
                el.removeEventListener(event, callback);
              });
            }
          }
        }
      }
    });
  }
}
const BlazeEventsMixin = {
  beforeCreate: initBlazeEvents,
  mounted: updateBlazeEvents,
  updated: updateBlazeEvents,
}
Vue.mixin(BlazeEventsMixin);

// Override vue instanciation
const _init = Vue.prototype._init;
Vue.prototype._init = function(options) {

  // Private object that will be binded to Blaze callbacks
  this._template = {
    // New API
    $state: this,
    defineState: this.defineReactive.bind(this),
    // Blaze template API
    findAll: (selector) => {
      return this.$el.querySelectorAll(selector);
    },
    find: (selector) => {
      return this.$el.querySelector(selector);
    },
    get firstNode() {
      return this.$el.firstChild;
    },
    get lastNode() {
      return this.$el.lastChild;
    },
    get data() {
      console.warn('[blaze2] data context is not implemented yet');
      return this;
    },
    autorun: () => {
      return this.$autorun.apply(this, arguments);
    },
    subscribe: () => {
      return this.$subscribe.apply(this, arguments);
    },
    view: this,
  };

  _init.bind(this)(options);
};

// Register a Blaze template
Blaze.registerTemplate = function(name, def, register = true) {
  const options = def.options;

  options.beforeCreate = function() {
    if(options.methods) {
      const template = this._template || this;
      for(const k in options.methods) {
        template[k] = options.methods[k];
      }
    }
  }

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
            return option.bind(this._template || this)();
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
              return option.bind(this._template || this)();
            };
          }
          options.meteor[k] = result;
        }
      }
    },
    events(map) {
      // TODO events
      if(!options._events) {
        options._events = [];
      }

      for(const k in map) {
        let event, selector;
        const index = k.indexOf(' ');
        if(index === -1) {
          event = k;
          selector = null;
        } else {
          event = k.substr(0, index);
          selector = k.substr(index + 1);
        }
        const callback = map[k];
        options._events.push({
          event,
          selector,
          callback,
        });
      }
    },
    methods(map) {
      for(const k in map) {
        if(!options.methods) {
          options.methods = {};
        }
        options.methods[k] = function(...args) {
          return map[k].bind(this._template || this)(...args);
        };
      }
    },
  };

  if(register) {
    Meteor.startup(() => {
      Vue.component(name, options);
    });
  }

  return options;
};

// Add the root Vue component to the page
// (after Meteor startup and one tick later)
Blaze.registerRootComponent = function(def) {
  Meteor.startup(() => {
    Meteor.defer(() => {
      const div = document.createElement('div');
      div.setAttribute('id', 'app');
      document.body.appendChild(div);

      const options = Blaze.registerTemplate('body', def, false);
      new Vue(options).$mount('#app');
    });
  });
};

Template.instance = function() {
  console.warn('[blaze2] Template.instance is not implemented yet.');
};

Template.currentData = function() {
  console.warn('[blaze2] Template.currentData is not implemented yet.');
};

Template.parentData = function(numLevels = 1) {
  console.warn('[blaze2] Template.parentData is not implemented yet.');
};
