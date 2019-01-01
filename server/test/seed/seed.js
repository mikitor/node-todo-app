const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('../../models/todo');
const { User } = require('../../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();

const todos = [
  {
    _id: new ObjectID(),
    text: 'First todo',
    completed: true,
    completedAt: new Date().getTime(),
    _owner: userOneID,
  },
  {
    _id: new ObjectID(),
    text: 'Second todo',
    _owner: userTwoID,
  },
];

const users = [
  {
    _id: userOneID,
    email: 'test1@gmail.com',
    password: 'userOnePass',
    tokens: [{
      access: 'auth',
      token: jwt.sign({ _id: userOneID, access: 'auth' }, process.env.JWT_SECRET).toString(),
    }],
  },
  {
    _id: userTwoID,
    email: 'test2@gmail.com',
    password: 'userTwoPass',
  },
];

const populateTodos = (done) => {
  Todo.deleteMany({}).then(() => {
    Todo.insertMany(todos, (err, todos) => {
      if (err) {
        return done(err);
      }
      done();
    });
  });
};

const populateUsers = (done) => {
  User
    .deleteMany({})
    .then(() => {
      const userOne = new User(users[0]).save();
      const userTwo = new User(users[1]).save();

      return Promise.all([userOne, userTwo]);
    })
    .then(() => done());
};

module.exports = {
  todos,
  users,
  populateTodos,
  populateUsers,
};
