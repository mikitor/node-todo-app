const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { todos, users, populateTodos, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should add a todo', (done) => {
    const text = 'test todo';

    request(app)
      .post('/todos')
      .send({
        text,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then((todos) => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create a todo with an invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then((todos) => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });
});

describe('GET /todos', () => {
  it('should list all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return the todo', (done) => {
    const id = todos[0]._id.toHexString();
    const { text } = todos[0];
    request(app)
      .get(`/todos/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });

  it('should return 404 if id is invalid', (done) => {
    request(app)
      .get('/todos/123')
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is not found', (done) => {
    const hexId = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should delete the todo', (done) => {
    const id = todos[0]._id.toHexString();
    const { text } = todos[0];
    request(app)
      .delete(`/todos/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(id);
        expect(res.body.todo.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo
          .findById(id)
          .then((todo) => {
            expect(todo).toBeNull();
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return 404 if id is invalid', (done) => {
    request(app)
      .delete('/todos/123')
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is not found', (done) => {
    const hexId = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    const id = todos[1]._id.toHexString();
    const text = 'Completed todo';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text,
        completed: true,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end(done);
  });

  it('should remove completedAt if todo is not completed', (done) => {
    const id = todos[0]._id.toHexString();
    const text = 'Todo';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text,
        completed: false,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBeNull();
      })
      .end(done);
  });

  it('should return 404 if id is invalid', (done) => {
    request(app)
      .patch('/todos/123')
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is not found', (done) => {
    const hexId = new ObjectID().toHexString();
    request(app)
      .patch(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return an id and email if user has correct token', (done) => {
    const id = users[0]._id.toHexString();
    const email = users[0].email;
    const token = users[0].tokens[0].token;

    request(app)
      .get('/users/me')
      .set('x-auth', token)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(email);
        expect(res.body._id).toBe(id);
      })
      .end(done);
  });
  it('should return 401 if user does not have correct token', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should add a user', (done) => {
    const email = 'ahh@gmail.com';
    const password = 'coolThing';

    request(app)
      .post('/users')
      .send({
        email,
        password
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(email);
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User
          .find({ email })
          .then((user) => {
            expect(user).toBeTruthy();
            expect(user.length).toBe(1);
            expect(user.password).not.toBe(password);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create a user with an invalid email or password', (done) => {
    const email = 'ahhgmail.com';
    const password = 'cool';

    request(app)
      .post('/users')
      .send({
        email,
        password
      })
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User
          .find()
          .then((user) => {
            expect(user.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create user if email in use', (done) => {
    const email = users[0].email;
    const password = 'testPassword';
    request(app)
      .post('/users')
      .send({
        email,
        password,
      })
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User
          .findOne({ email })
          .then((user) => {
            expect(user).toBeTruthy();
            expect(user.password).not.toBe(password);
            done();
          })
          .catch(err => done(err));
      });
  });
});
