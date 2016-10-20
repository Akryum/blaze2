import { Meteor } from 'meteor/meteor';
import Vue from 'vue';
import VueMeteor from 'vue-meteor-tracker';

Vue.use(VueMeteor, {
  freeze: true,
});

export const Blaze = {};
export const Template = {};

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

Blaze.registerTemplate = function(name, def) {
  const options = def.options;

  options.beforeCreate = function() {
    this.state = {
      $state: this,
      $component: this,
      defineState: (map) => {
        for(const k in map) {
          Vue.util.defineReactive(this, k, map[k]);
        }
      },
    };

    if(options.methods) {
      for(const k in options.methods) {
        this.state[k] = options.methods[k];
      }
    }
  };

  Template[name] = {
    name,
    componentDefinition: options,
    // Hooks
    onCreated(callback) {
      const bc = options.beforeCreate;
      options.beforeCreate = function() {
        bc.bind(this)();
        return callback.bind(this.state)();
      };
    },
    onDestroyed(callback) {
      const bc = options.destroyed;
      options.destroyed = function() {
        bc.bind(this)();
        return callback.bind(this.state)();
      };
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
            return option.bind(this.state)();
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
              return option.bind(this.state)();
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
          return map[k].bind(this.state)(...args);
        };
      }
    },
  };

  Meteor.startup(() => {
    Vue.component(name, options);
  });
};
