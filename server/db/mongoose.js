const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/Todo', { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('We are connected'));

module.exports = {
  mongoose,
};
