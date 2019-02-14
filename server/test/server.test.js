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
  it('should add a todo', done => {
    const text = 'test todo';
    const { token } = users[0].tokens[0];

    request(app)
      .post('/todos')
      .set('x-auth', token)
      .send({
        text
      })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create a todo with an invalid body data', done => {
    const { token } = users[0].tokens[0];
    request(app)
      .post('/todos')
      .set('x-auth', token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create a todo with an invalid token', done => {
    const text = 'test todo';
    request(app)
      .post('/todos')
      .set('x-auth', '22t3t3tt33')
      .send({ text })
      .expect(401)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });
});

describe('GET /todos', () => {
  it('should list all todos', done => {
    const { token } = users[0].tokens[0];
    request(app)
      .get('/todos')
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return the todo', done => {
    const id = todos[0]._id.toHexString();
    const { token } = users[0].tokens[0];
    const { text } = todos[0];
    request(app)
      .get(`/todos/${id}`)
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(id);
        expect(res.body.todo.text).toBe(text);
      })
      .end(done);
  });

  it('should return 404 if id is invalid', done => {
    const { token } = users[0].tokens[0];
    request(app)
      .get('/todos/123')
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is not found', done => {
    const hexId = new ObjectID().toHexString();
    const { token } = users[0].tokens[0];
    request(app)
      .get(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 401 if token is invalid', done => {
    const hexId = new ObjectID().toHexString();
    const token = '123';
    request(app)
      .get(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(401)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should delete the todo', done => {
    const { token } = users[0].tokens[0];
    const id = todos[0]._id.toHexString();
    const { text } = todos[0];
    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(id);
        expect(res.body.todo.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(id)
          .then(todo => {
            expect(todo).toBeNull();
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return 404 if id is invalid', done => {
    const { token } = users[0].tokens[0];
    request(app)
      .delete('/todos/123')
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is not found', done => {
    const { token } = users[0].tokens[0];
    const hexId = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 401 if token is invalid', done => {
    const hexId = new ObjectID().toHexString();
    const token = '123';
    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(401)
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return an id and email if user has correct token', done => {
    const id = users[0]._id.toHexString();
    const email = users[0].email;
    const token = users[0].tokens[0].token;

    request(app)
      .get('/users/me')
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toBe(email);
        expect(res.body._id).toBe(id);
      })
      .end(done);
  });
  it('should return 401 if user does not have correct token', done => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should add a user', done => {
    const email = 'ahh@gmail.com';
    const password = 'coolThing';

    request(app)
      .post('/users')
      .send({
        email,
        password
      })
      .expect(200)
      .expect(res => {
        expect(res.body.email).toBe(email);
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.find({ email })
          .then(user => {
            expect(user).toBeTruthy();
            expect(user.length).toBe(1);
            expect(user.password).not.toBe(password);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create a user with an invalid email or password', done => {
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

        User.find()
          .then(user => {
            expect(user.length).toBe(2);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should not create user if email in use', done => {
    const email = users[0].email;
    const password = 'testPassword';
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
        User.findOne({ email })
          .then(user => {
            expect(user).toBeTruthy();
            expect(user.password).not.toBe(password);
            done();
          })
          .catch(err => done(err));
      });
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', done => {
    const { email, password } = users[1];
    request(app)
      .post('/users/login')
      .send({
        email,
        password
      })
      .expect(200)
      .expect(res => {
        expect(res.header['x-auth']).toBeTruthy();
        expect(res.body.email).toBe(email);
        expect(res.body._id).toBeTruthy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findOne({ email })
          .then(user => {
            expect(user.email).toBe(email);
            expect(user.tokens.length).toBe(1);
            expect(user.tokens[0]).toMatchObject({
              access: 'auth',
              token: res.header['x-auth']
            });
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return a 400 if the credentials are invalid', done => {
    const email = 'test33@gmail.com';
    const password = ' gz3u4z6vffff*A';
    request(app)
      .post('/users/login')
      .send({
        email,
        password
      })
      .expect(400)
      .expect(res => {
        expect(res.header['x-auth']).toBeUndefined();
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', done => {
    const { token } = users[0].tokens[0];
    const id = todos[0]._id.toHexString();
    const text = 'Completed todo';

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .send({
        text,
        completed: true
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end(done);
  });

  it('should remove completedAt if todo is not completed', done => {
    const { token } = users[0].tokens[0];
    const id = todos[0]._id.toHexString();
    const text = 'Todo';

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .send({
        text,
        completed: false
      })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBeNull();
      })
      .end(done);
  });

  it('should return 404 if id is invalid', done => {
    const { token } = users[0].tokens[0];
    request(app)
      .patch('/todos/123')
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if id is not found', done => {
    const hexId = new ObjectID().toHexString();
    const { token } = users[0].tokens[0];

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if token is invalid', done => {
    const { token } = users[0].tokens[0];
    const id = todos[1]._id.toHexString();
    const text = 'Todo';

    request(app)
      .patch(`/todos/${id}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove token if token is valid', done => {
    const { token } = users[0].tokens[0];
    const { _id } = users[0];

    request(app)
      .delete('/users/me/token')
      .set('x-auth', token)
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findOne({ _id })
          .then(user => {
            if (!user) {
              return done(err);
            }
            expect(user.tokens.length).toBe(0);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return 400 if token is invalid', done => {
    const { _id } = users[0];

    request(app)
      .delete('/users/me/token')
      .set('x-auth', '123')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findOne({ _id })
          .then(user => {
            if (!user) {
              return done(err);
            }
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch(err => done(err));
      });
  });
});
