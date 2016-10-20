import { Meteor } from 'meteor/meteor';

Meteor.publish('tasks', function(done) {
  return Tasks.find({
    $or: [{done: false}, {done}],
  });
});
