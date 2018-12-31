const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('We are connected'));

// Fixing all the Mongoose deprecation warnings
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

module.exports = {
  mongoose,
};
