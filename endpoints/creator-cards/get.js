const { createHandler } = require('../../core/express');
const getCreatorCard = require('../../services/creator-cards/get');
const messages = require('../../messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const { access_code } = rc.query;

    const card = await getCreatorCard(slug, access_code);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: messages.GET_SUCCESS,
      data: card,
    };
  },
});
