const { throwAppError } = require('../../core/errors');
const CreatorCard = require('../../models/creator-card');
const messages = require('../../messages/creator-card');
const { serializeCard } = require('./create');

async function getCreatorCard(slug, queryAccessCode) {
  const card = await CreatorCard.findOne({ slug, deleted: null });

  if (!card) {
    throwAppError(messages.CARD_NOT_FOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwAppError(messages.CARD_IS_DRAFT, 'NF02');
  }

  if (card.access_type === 'private') {
    if (!queryAccessCode) {
      throwAppError(messages.CARD_PRIVATE_NO_CODE, 'AC03');
    }
    if (queryAccessCode !== card.access_code) {
      throwAppError(messages.INVALID_ACCESS_CODE, 'AC04');
    }
  }

  const serialized = serializeCard(card);
  // access_code must NEVER be returned by the public retrieval endpoint
  delete serialized.access_code;

  return serialized;
}

module.exports = getCreatorCard;
