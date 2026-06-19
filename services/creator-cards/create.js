const { throwAppError } = require('../../core/errors');
const { ulid, randomAlphanumeric } = require('../../core/randomness');
const CreatorCard = require('../../models/creator-card');
const messages = require('../../messages/creator-card');

function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '');
}

async function isSlugTaken(slug) {
  const existing = await CreatorCard.findOne({ slug, deleted: null });
  return !!existing;
}

async function createCreatorCard(payload) {
  const {
    title,
    description,
    slug: providedSlug,
    creator_reference,
    links = [],
    service_rates,
    status,
    access_type = 'public',
    access_code,
  } = payload;

  // Business rule: access_code required when private
  if (access_type === 'private' && !access_code) {
    throwAppError(messages.ACCESS_CODE_REQUIRED, 'AC01');
  }

  // Business rule: access_code must not be set on public cards
  if (access_type !== 'private' && access_code) {
    throwAppError(messages.ACCESS_CODE_NOT_ALLOWED, 'AC05');
  }

  // Slug handling
  let slug;
  if (providedSlug) {
    if (await isSlugTaken(providedSlug)) {
      throwAppError(messages.SLUG_TAKEN, 'SL02');
    }
    slug = providedSlug;
  } else {
    const baseSlug = generateSlugFromTitle(title);
    if (baseSlug.length < 5 || (await isSlugTaken(baseSlug))) {
      slug = `${baseSlug}-${randomAlphanumeric(6)}`;
      // Ensure even the suffixed slug is unique
      while (await isSlugTaken(slug)) {
        slug = `${baseSlug}-${randomAlphanumeric(6)}`;
      }
    } else {
      slug = baseSlug;
    }
  }

  const now = Date.now();
  const id = ulid();

  const card = new CreatorCard({
    _id: id,
    title,
    description: description || null,
    slug,
    creator_reference,
    links,
    service_rates: service_rates || null,
    status,
    access_type,
    access_code: access_type === 'private' ? access_code : null,
    created: now,
    updated: now,
    deleted: null,
  });

  await card.save();

  return serializeCard(card);
}

function serializeCard(card) {
  const obj = card.toObject ? card.toObject() : { ...card };
  const result = {
    id: obj._id,
    title: obj.title,
    description: obj.description,
    slug: obj.slug,
    creator_reference: obj.creator_reference,
    links: obj.links || [],
    service_rates: obj.service_rates || null,
    status: obj.status,
    access_type: obj.access_type,
    access_code: obj.access_code || null,
    created: obj.created,
    updated: obj.updated,
    deleted: obj.deleted,
  };
  return result;
}

module.exports = { createCreatorCard, serializeCard };
