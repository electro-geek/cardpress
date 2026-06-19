require('module-alias/register');
require('dotenv').config();
process.env.__ALREADY_BOOTSTRAPPED_ENVS = true;

module.exports = require('./app');
