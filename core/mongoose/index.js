const mongoose = require('mongoose');

async function createConnection({ uri } = {}) {
  try {
    await mongoose.connect(uri || process.env.MONGODB_URI);
    console.log('[Mongoose] Connected to MongoDB');
  } catch (err) {
    console.error('[Mongoose] Connection error:', err.message);
    throw err;
  }
}

function createModel(modelName, schemaDefinition) {
  const schema = new mongoose.Schema(schemaDefinition);
  return mongoose.model(modelName, schema);
}

module.exports = { createConnection, createModel, mongoose };
