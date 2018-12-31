require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

// create application/json parser
const jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.post('/todos', jsonParser, (req, res) => {
  if (!req.body) return res.status(400);
  const { text } = req.body;
  const todo = new Todo({
    text,
  });
  todo.save().then((docs) => {
    res.send(docs);
  }, (err) => {
    res.status(400).send(err);
  });
});

app.post('/users', jsonParser, (req, res) => {
  if (!req.body) return res.status(400);
  const { email, password } = req.body;
  const user = new User({
    email,
    password,
  });
  user
    .save()
    .then(() => user.generateAuthToken())
    .then((token) => {
      res.header('x-auth', token).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', jsonParser, (req, res) => {
  if (!req.body.email || !req.body.email) {
    return res.status(400).send();
  }
  const { email, password } = req.body;
  User
    .findByCredentials(email, password)
    .then((user) => {
      return user.generateAuthToken().then((token) => {
        res.set('x-auth', token).send(user);
      });
    })
    .catch((err) => res.status(400).send());
});

app.delete('/users/me/token', authenticate, (req, res) => {
  User.updateOne({ _id: req.user._id }, { $pull: { tokens: { token: req.token } } })
    .then((user) => {
      res.status(200).send();
    })
    .catch((err) => res.status(400).send());
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({ todos });
  }, (err) => {
    res.status(400).send(err);
  });
});

app.get('/todos/:id', (req, res) => {
  const { id } = req.params;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Todo.findOne({ _id: id }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Todo.findOneAndDelete({ _id: id }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

app.patch('/todos/:id', jsonParser, (req, res) => {
  const { id } = req.params;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo
    .findOneAndUpdate(
      { _id: id },
      { $set: body },
      { new: true },
    )
    .then((todo) => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    })
    .catch((err) => {
      res.status(400).send();
    });
});

app.listen(port, () => console.log(`Started on port ${port}`));

module.exports = {
  app,
};
