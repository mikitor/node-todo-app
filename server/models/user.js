const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    minlength: 1,
    required: true,
    unique: true,
    validate: {
      validator(value) {
        return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
      },
      message: props => `${props.value} is not a valid email`,
    },
  },
  password: {
    type: String,
    minlength: 8,
    required: true,
  },
  tokens: [{
    access: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  }],
});

userSchema.methods.toJSON = function () {
  const { _id, email } = this.toObject();
  return { _id, email };
};

userSchema.methods.generateAuthToken = function () {
  const access = 'auth';
  const secret = 'duhez6363zr';
  const token = jwt.sign({ _id: this._id, access }, secret).toString();

  this.tokens = this.tokens.concat([{ access, token }]);

  return this.save().then(() => {
    return token;
  });
};

userSchema.statics.findByToken = function (token) {
  let decoded;

  try {
    decoded = jwt.verify(token, 'duhez6363zr');
  } catch (e) {
    return Promise.reject(e);
  }

  return this.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': decoded.access,
  });
};

userSchema.pre('save', function (next) {
  const user = this;
  if (user.isModified('password')) {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(user.password, salt, function (err, hash) {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = new mongoose.model('User', userSchema);

module.exports = {
  User,
};
