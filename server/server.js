const express = require('express');
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = 3000;

// create application/json parser
const jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })

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

app.listen(port, () => console.log(`Started on port ${port}`));

module.exports = {
  app,
};
