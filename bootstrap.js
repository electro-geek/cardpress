require('dotenv').config();

(async () => {
  process.env.__ALREADY_BOOTSTRAPPED_ENVS = true;
  require('./app');
})();
