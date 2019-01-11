require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

// create application/json parser
app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  if (!req.body) return res.status(400);
  const { text } = req.body;
  const _owner = req.user._id;
  const todo = new Todo({
    text,
    _owner,
  });

  todo.save().then((docs) => {
    res.send(docs);
  }, (err) => {
    res.status(400).send(err);
  });
});

app.post('/users', (req, res) => {
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

app.post('/users/login', (req, res) => {
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

app.get('/todos', authenticate, (req, res) => {
  const _owner = req.user._id;

  Todo.find({ _owner })
    .then((todos) => {
      res.send({ todos });
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.get('/todos/:id', authenticate, (req, res) => {
  const _owner = req.user._id;
  const { id } = req.params;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Todo.findOne({ _id: id, _owner }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

app.delete('/todos/:id', authenticate, (req, res) => {
  const _owner = req.user._id;
  const { id } = req.params;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Todo.findOneAndDelete({ _id: id, _owner }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({ todo });
  }).catch((err) => {
    res.status(400).send();
  });
});

app.patch('/todos/:id', authenticate, (req, res) => {
  const _owner = req.user._id;
  const { id } = req.params;
    const { text, completed } = req.body;
    const body = { text, completed };

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (typeof body.completed === 'boolean' && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo
    .findOneAndUpdate(
      { _id: id, _owner },
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
