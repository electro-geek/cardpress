const mongoose = require('mongoose');

let connectionPromise = null;

async function createConnection({ uri } = {}) {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (connectionPromise) return connectionPromise;   // connection in progress

  connectionPromise = mongoose
    .connect(uri || process.env.MONGODB_URI)
    .then(() => {
      console.log('[Mongoose] Connected to MongoDB');
    })
    .catch((err) => {
      connectionPromise = null;
      console.error('[Mongoose] Connection error:', err.message);
      throw err;
    });

  return connectionPromise;
}

function createModel(modelName, schemaDefinition) {
  const schema = new mongoose.Schema(schemaDefinition);
  return mongoose.model(modelName, schema);
}

module.exports = { createConnection, createModel, mongoose };
