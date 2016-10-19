import { Template } from 'meteor/akryum:blaze2';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.hello.onCreated(function () {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
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

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    this.incrementCounter();
  },
});


Template.message.onCreated(function() {
  // Local reactive data
  this.defineData({
    msg: 'Hello world!',
  });
});

Template.condition.onCreated(function() {
  this.defineData({
    show: false,
  });
});

// Todos

Template.todos.onCreated(function() {
  this.defineData({
    newTxt: '',
  });
});

Template.todos.helpers({
  tasks() {
    return Tasks.find({}, { sort: {date:-1} });
  },
});

Template.todos.methods({
  addTask() {
    console.log(this);
    // Access local reactive data
    if(this.$data.newTxt.length !== 0) {
      // Business
      Tasks.insert({
        text: this.$data.newTxt,
        date: new Date(),
      });
      // Clear the input
      this.$data.newTxt = '';
    }
  },
  removeTask(_id) {
    Tasks.remove(_id);
  },
});
