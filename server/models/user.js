const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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
    validate: {
      validator(value) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
      },
      message: props => "The password doesn't contain eight characters, at least one uppercase letter, one lowercase letter, one number and one special character",
    },
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

const User = new mongoose.model('User', userSchema);

module.exports = {
  User,
};
