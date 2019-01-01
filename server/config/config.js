const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  const config = require('./config.json');
  process.env = config[env];
}
