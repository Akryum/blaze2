import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  addTask(text) {
    check(text, String);
    Tasks.insert({
      text: text,
      date: new Date(),
      done: false,
    });
  },
  setTaskDone(_id, done) {
    check(_id, String);
    check(done, Boolean);
    Tasks.update(_id, {
      $set: {
        done,
        dateDone: new Date(),
      },
    });
  },
  removeTask(_id) {
    check(_id, String);
    Tasks.remove(_id);
  },
});
