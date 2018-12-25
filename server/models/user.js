const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    minlength: 1,
    required: true,
  },
});
const User = new mongoose.model('User', userSchema);

module.exports = {
  User,
};
