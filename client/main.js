import { Template } from 'meteor/akryum:blaze2';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.hello.onCreated(function() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.onRendered(function() {
  console.log('rendered');
});

Template.hello.helpers({
  counter() {
    return this.counter.get();
  },
});

// Template methods
Template.hello.methods({
  incrementCounter() {
    this.counter.set(this.counter.get() + 1);
  },
});

// Not working yet
Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    this.incrementCounter();
  },
});


Template.message.onCreated(function() {
  // Local reactive data
  this.defineState({
    msg: 'Hello world!',
    htmlMsg: '<b>Bold</b> <i>Italic</i>',
  });
});

Template.condition.onCreated(function() {
  this.defineState({
    show: false,
  });
});

Template.destroyable.onDestroyed(function() {
  console.log('destroyed');
});

// Todos

Template.todos.onCreated(function() {
  this.defineState({
    newTxt: '',
    showDone: true,
  });
});

// Easy subscriptions
Template.todos.subscribe({
  tasks() {
    return [this.$state.showDone];
  },
});

Template.todos.helpers({
  tasks() {
    return Tasks.find({
      // Not working yet
      // Need hybrid watching Vue/Tracker
      // $or: [{done: false}, {done:this.$state.showDone}],
    }, {
      sort: {date:-1},
    });
  },
});

Template.todos.methods({
  addTask() {
    console.log(this);
    // Access local reactive data
    if(this.$state.newTxt.length !== 0) {
      // Business
      Meteor.call('addTask', this.$state.newTxt);
      // Clear the input
      this.$state.newTxt = '';
    }
  },
  setDone(_id, done) {
    Meteor.call('setTaskDone', _id, done);
  },
  removeTask(_id) {
    Meteor.call('removeTask', _id);
  },
});
