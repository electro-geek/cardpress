if (!process.env.__ALREADY_BOOTSTRAPPED_ENVS) require('dotenv').config();

const { createServer } = require('./core/express');
const { createConnection } = require('./core/mongoose');
const { createQueue } = require('./core/queue');

createQueue();

const server = createServer({
  port: process.env.PORT || 8811,
  JSONLimit: '150mb',
  enableCors: true,
});

const endpoints = [
  require('./endpoints/creator-cards/create'),
  require('./endpoints/creator-cards/get'),
  require('./endpoints/creator-cards/delete'),
];

endpoints.forEach((handler) => server.addHandler(handler));

if (process.env.VERCEL) {
  const handler = async (req, res) => {
    await createConnection({ uri: process.env.MONGODB_URI });
    return server.executeRequest(req, res);
  };
  module.exports = handler;
} else {
  createConnection({ uri: process.env.MONGODB_URI })
    .then(() => server.startServer())
    .catch((err) => {
      console.error('Failed to connect to MongoDB, exiting.', err.message);
      process.exit(1);
    });
}
