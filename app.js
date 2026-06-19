/* eslint-disable global-require */
if (!process.env.__ALREADY_BOOTSTRAPPED_ENVS) require('dotenv').config();

const { createServer } = require('@app-core/server');
const { createConnection } = require('@app-core/mongoose');
const { createQueue } = require('@app-core/queue');

createQueue();

const server = createServer({
  port: process.env.PORT || 8811,
  JSONLimit: '150mb',
  enableCors: true,
});

// Register endpoints explicitly (no dynamic fs.readdirSync)
const endpoints = [
  require('./endpoints/creator-cards/create'),
  require('./endpoints/creator-cards/get'),
  require('./endpoints/creator-cards/delete'),
];

endpoints.forEach((handler) => server.addHandler(handler));

if (process.env.VERCEL) {
  // On Vercel: connect lazily on first request, then hand off to Express
  const handler = async (req, res) => {
    await createConnection({ uri: process.env.MONGODB_URI });
    return server.executeRequest(req, res);
  };
  module.exports = handler;
} else {
  // Local / Render: connect then start server
  createConnection({ uri: process.env.MONGODB_URI })
    .then(() => server.startServer())
    .catch((err) => {
      console.error('Failed to connect to MongoDB, exiting.', err.message);
      process.exit(1);
    });
}
