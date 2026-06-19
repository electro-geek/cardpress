const { createHandler } = require('../../core/express');
const { throwAppError } = require('../../core/errors');
const deleteCreatorCard = require('../../services/creator-cards/delete');
const messages = require('../../messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const body = rc.body || {};

    // Validate creator_reference
    if (!body.creator_reference || typeof body.creator_reference !== 'string') {
      throwAppError('creator_reference is required and must be a string', 'VALIDATION_ERROR');
    }
    if (body.creator_reference.length !== 20) {
      throwAppError('creator_reference must be exactly 20 characters', 'VALIDATION_ERROR');
    }

    const card = await deleteCreatorCard(slug);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: messages.DELETE_SUCCESS,
      data: card,
    };
  },
});
