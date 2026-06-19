/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
if (!process.env.__ALREADY_BOOTSTRAPPED_ENVS) require('dotenv').config();

const fs = require('fs');
const { createServer } = require('@app-core/server');
const { createConnection } = require('@app-core/mongoose');
const { createQueue } = require('@app-core/queue');

createQueue();

const server = createServer({
  port: process.env.PORT || 8811,
  JSONLimit: '150mb',
  enableCors: true,
});

const ENDPOINT_CONFIGS = [
  {
    path: './endpoints/creator-cards/',
  },
];

function setupEndpointHandlers(basePath, options = {}) {
  const dirs = fs.readdirSync(basePath);

  dirs.forEach((file) => {
    const handler = require(`${basePath}${file}`);

    if (options.pathPrefix) {
      handler.path = `${options.pathPrefix}${handler.path}`;
    }

    server.addHandler(handler);
  });
}

ENDPOINT_CONFIGS.forEach((config) => {
  setupEndpointHandlers(config.path, config.options);
});

if (process.env.VERCEL) {
  // On Vercel: connect lazily on first request, then hand off to Express
  const handler = async (req, res) => {
    await createConnection({ uri: process.env.MONGODB_URI });
    return server.executeRequest(req, res);
  };
  module.exports = handler;
} else {
  // Local / Heroku / Render: connect then start server
  createConnection({ uri: process.env.MONGODB_URI })
    .then(() => server.startServer())
    .catch((err) => {
      console.error('Failed to connect to MongoDB, exiting.', err.message);
      process.exit(1);
    });
}
