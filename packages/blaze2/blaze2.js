import { Meteor } from 'meteor/meteor';
import Vue from 'vue';
//window.Vue = Vue;

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
      $data: this,
      $component: this,
      defineData: (map) => {
        for(const k in map) {
          Vue.util.defineReactive(this, k, map[k]);
        }
      },
    };

    /*Object.defineProperty(this.state, '$data', {
      get:() => {
        return this.$data;
      },
    });*/

    if(options.methods) {
      for(const k in options.methods) {
        this.state[k] = options.methods[k];
      }
    }
  };

  Template[name] = {
    name,
    onCreated(callback) {
      const bc = options.beforeCreate;
      options.beforeCreate = function() {
        bc.bind(this)();
        return callback.bind(this.state)();
      };
    },
    helpers(map) {
      if(!options.meteor) {
        options.meteor = {};
      }
      for(const k in map) {
        options.meteor[k] = function() {
          return map[k].bind(this.state)();
        };
      }
    },
    events(map) {
      // TODO
      for(const k in map) {
        const index = k.indexOf(' ');
        const event = k.substr(0, index);
        const selector = k.substr(index + 1);
        console.log('event', event, 'selector', selector);
      }
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
    componentDefinition: options,
  };

  Meteor.startup(() => {
    Vue.component(name, options);
  });
};

Meteor.startup(() => {
  Vue.config.meteor.freeze = true;
});
