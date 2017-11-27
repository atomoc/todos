import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Todos } from './todos.js';
import { Lists } from '../lists/lists.js';

export const insert = new ValidatedMethod({
  name: 'todos.insert',
  validate: Todos.simpleSchema().pick(['listId', 'text']).validator({ clean: true, filter: false }),
  run({ listId, text }) {
    const list = Lists.findOne(listId);

    if (list.isPrivate() && list.userId !== this.userId) {
      throw new Meteor.Error('todos.insert.accessDenied',
        'Cannot add todos to a private list that is not yours');
    }

    const todo = {
      listId,
      text,
      checked: false,
      createdAt: new Date(),
    };

    Todos.insert(todo);
  },
});

export const setCheckedStatus = new ValidatedMethod({
  name: 'todos.makeChecked',
  validate: new SimpleSchema({
    todoId: Todos.simpleSchema().schema('_id'),
    newCheckedStatus: Todos.simpleSchema().schema('checked'),
  }).validator({ clean: true, filter: false }),
  run({ todoId, newCheckedStatus }) {
    const todo = Todos.findOne(todoId);

    if (todo.checked === newCheckedStatus) {
      // The status is already what we want, let's not do any extra work
      return;
    }

    if (!todo.editableBy(this.userId)) {
      throw new Meteor.Error('todos.setCheckedStatus.accessDenied',
        'Cannot edit checked status in a private list that is not yours');
    }

    Todos.update(todoId, { $set: {
      checked: newCheckedStatus,
    } });
  },
});

var times = [],
    times_t = [];

export const updateText = new ValidatedMethod({
  name: 'todos.updateText',
  validate: new SimpleSchema({
    todoId: Todos.simpleSchema().schema('_id'),
    newText: Todos.simpleSchema().schema('text'),
  }).validator({ clean: true, filter: false }),
  run({ todoId, newText }) {
    // This is complex auth stuff - perhaps denormalizing a userId onto todos
    // would be correct here?
    const todo = Todos.findOne(todoId);

    if (!todo.editableBy(this.userId)) {
      throw new Meteor.Error('todos.updateText.accessDenied',
        'Cannot edit todos in a private list that is not yours');
    }

    Todos.update(todoId, {
      $set: {
        text: (_.isUndefined(newText) ? null : newText),
      },
    });

    // var oldtext = 123,
    //     list = Lists.findOne(todo.listId);
    //
    // if (times_t[todo.listId]){
    //     clearTimeout(times_t[todo.listId]);
    // }
    //
    // times_t[todo.listId] = setTimeout(()=>{
    //
    //     if (!times[todo.listId]) {
    //
    //         times[todo.listId] = new Date().getTime();
    //
    //         //Meteor.call('userNotification', 'Изменён пункт "'+oldtext+'" на "'+newText+'"', 'Список "'+list.name+'"', list.userId, list.name);
    //         Push.send({
    //             from: list.name,
    //             title: 'Список "'+list.name+'"',
    //             text: 'Изменён пункт "'+oldtext+'" на "'+newText+'"',
    //             badge: 1,
    //             query: {
    //                 userId: list.userId
    //             },
    //         });
    //         //console.log('Изменён пункт "'+oldtext+'" на "'+newText+'"');
    //
    //     } else {
    //
    //         var time_this = new Date().getTime();
    //
    //         if (time_this - times[todo.listId] > 1000*60*1){
    //
    //             times[todo.listId] = new Date().getTime();
    //
    //             //Meteor.call('userNotification', 'Изменён пункт "'+oldtext+'" на "'+newText+'"', 'Список "'+list.name+'"', list.userId, list.name);
    //             console.log('Изменён пункт "'+oldtext+'" на "'+newText+'"');
    //
    //         }
    //     }
    //
    // }, 3000);

  },
});

export const remove = new ValidatedMethod({
  name: 'todos.remove',
  validate: new SimpleSchema({
    todoId: Todos.simpleSchema().schema('_id'),
  }).validator({ clean: true, filter: false }),
  run({ todoId }) {
    const todo = Todos.findOne(todoId);

    if (!todo.editableBy(this.userId)) {
      throw new Meteor.Error('todos.remove.accessDenied',
        'Cannot remove todos in a private list that is not yours');
    }

    Todos.remove(todoId);

    var todos_c = Todos.find({listId: todo.listId}).count(),
        list = Lists.findOne(todo.listId);

    if (!todos_c){
        Meteor.call('sendEmail', 'keydena@yandex.ru', 'Выполнен список "'+list.name+'"', 'Не забудем ;)');
    }

  },
});

// Get list of all method names on Todos
const TODOS_METHODS = _.pluck([
  insert,
  setCheckedStatus,
  updateText,
  remove,
], 'name');

if (Meteor.isServer) {
  // Only allow 5 todos operations per connection per second
  DDPRateLimiter.addRule({
    name(name) {
      return _.contains(TODOS_METHODS, name);
    },

    // Rate limit per connection ID
    connectionId() { return true; },
  }, 5, 1000);
}
