const { createHandler } = require('@app-core/server');
const { throwAppError } = require('@app-core/errors');
const { createCreatorCard } = require('../../services/creator-cards/create');
const messages = require('../../messages/creator-card');

function validateCreatePayload(body) {
  const errors = [];

  // title: required, 3-100 chars
  if (!body.title || typeof body.title !== 'string') {
    errors.push({ field: 'title', message: 'title is required and must be a string' });
  } else if (body.title.length < 3 || body.title.length > 100) {
    errors.push({ field: 'title', message: 'title must be between 3 and 100 characters' });
  }

  // creator_reference: required, exactly 20 chars
  if (!body.creator_reference || typeof body.creator_reference !== 'string') {
    errors.push({ field: 'creator_reference', message: 'creator_reference is required and must be a string' });
  } else if (body.creator_reference.length !== 20) {
    errors.push({ field: 'creator_reference', message: 'creator_reference must be exactly 20 characters' });
  }

  // status: required, must be draft or published
  if (!body.status || typeof body.status !== 'string') {
    errors.push({ field: 'status', message: 'status is required and must be a string' });
  } else if (!['draft', 'published'].includes(body.status)) {
    errors.push({ field: 'status', message: 'status must be either "draft" or "published"' });
  }

  // description: optional, max 500 chars
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push({ field: 'description', message: 'description must be a string' });
    } else if (body.description.length > 500) {
      errors.push({ field: 'description', message: 'description must be at most 500 characters' });
    }
  }

  // slug: optional, 5-50 chars, letters/numbers/hyphens/underscores
  if (body.slug !== undefined && body.slug !== null) {
    if (typeof body.slug !== 'string') {
      errors.push({ field: 'slug', message: 'slug must be a string' });
    } else if (body.slug.length < 5 || body.slug.length > 50) {
      errors.push({ field: 'slug', message: 'slug must be between 5 and 50 characters' });
    } else if (!/^[a-zA-Z0-9\-_]+$/.test(body.slug)) {
      errors.push({ field: 'slug', message: 'slug may only contain letters, numbers, hyphens, and underscores' });
    }
  }

  // links: optional array
  if (body.links !== undefined && body.links !== null) {
    if (!Array.isArray(body.links)) {
      errors.push({ field: 'links', message: 'links must be an array' });
    } else {
      body.links.forEach((link, i) => {
        if (!link.title || typeof link.title !== 'string') {
          errors.push({ field: `links[${i}].title`, message: 'link title is required and must be a string' });
        } else if (link.title.length < 1 || link.title.length > 100) {
          errors.push({ field: `links[${i}].title`, message: 'link title must be between 1 and 100 characters' });
        }
        if (!link.url || typeof link.url !== 'string') {
          errors.push({ field: `links[${i}].url`, message: 'link url is required and must be a string' });
        } else if (link.url.length > 200) {
          errors.push({ field: `links[${i}].url`, message: 'link url must be at most 200 characters' });
        } else if (!/^https?:\/\//.test(link.url)) {
          errors.push({ field: `links[${i}].url`, message: 'link url must start with http:// or https://' });
        }
      });
    }
  }

  // service_rates: optional object
  if (body.service_rates !== undefined && body.service_rates !== null) {
    const sr = body.service_rates;
    if (!sr.currency || !['NGN', 'USD', 'GBP', 'GHS'].includes(sr.currency)) {
      errors.push({ field: 'service_rates.currency', message: 'service_rates.currency must be one of NGN, USD, GBP, GHS' });
    }
    if (!Array.isArray(sr.rates) || sr.rates.length === 0) {
      errors.push({ field: 'service_rates.rates', message: 'service_rates.rates must be a non-empty array' });
    } else {
      sr.rates.forEach((rate, i) => {
        if (!rate.name || typeof rate.name !== 'string') {
          errors.push({ field: `service_rates.rates[${i}].name`, message: 'rate name is required and must be a string' });
        } else if (rate.name.length < 3 || rate.name.length > 100) {
          errors.push({ field: `service_rates.rates[${i}].name`, message: 'rate name must be between 3 and 100 characters' });
        }
        if (rate.description !== undefined && rate.description !== null) {
          if (typeof rate.description !== 'string') {
            errors.push({ field: `service_rates.rates[${i}].description`, message: 'rate description must be a string' });
          } else if (rate.description.length > 250) {
            errors.push({ field: `service_rates.rates[${i}].description`, message: 'rate description must be at most 250 characters' });
          }
        }
        if (rate.amount === undefined || rate.amount === null) {
          errors.push({ field: `service_rates.rates[${i}].amount`, message: 'rate amount is required' });
        } else if (!Number.isInteger(rate.amount) || rate.amount < 1) {
          errors.push({ field: `service_rates.rates[${i}].amount`, message: 'rate amount must be a positive integer' });
        }
      });
    }
  }

  // access_type: optional, must be public or private
  if (body.access_type !== undefined && body.access_type !== null) {
    if (!['public', 'private'].includes(body.access_type)) {
      errors.push({ field: 'access_type', message: 'access_type must be either "public" or "private"' });
    }
  }

  // access_code: if present, must be exactly 6 alphanumeric characters
  if (body.access_code !== undefined && body.access_code !== null) {
    if (typeof body.access_code !== 'string' || !/^[a-zA-Z0-9]{6}$/.test(body.access_code)) {
      errors.push({ field: 'access_code', message: 'access_code must be exactly 6 alphanumeric characters' });
    }
  }

  return errors;
}

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const body = rc.body;

    const validationErrors = validateCreatePayload(body);
    if (validationErrors.length > 0) {
      throwAppError(validationErrors[0].message, 'VALIDATION_ERROR', { details: validationErrors });
    }

    const card = await createCreatorCard(body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: messages.CREATE_SUCCESS,
      data: card,
    };
  },
});
