const { throwAppError } = require('@app-core/errors');
const CreatorCard = require('../../models/creator-card');
const messages = require('../../messages/creator-card');
const { serializeCard } = require('./create');

async function deleteCreatorCard(slug) {
  const card = await CreatorCard.findOne({ slug, deleted: null });

  if (!card) {
    throwAppError(messages.CARD_NOT_FOUND, 'NF01');
  }

  const now = Date.now();
  card.deleted = now;
  card.updated = now;
  await card.save();

  return serializeCard(card);
}

module.exports = deleteCreatorCard;
