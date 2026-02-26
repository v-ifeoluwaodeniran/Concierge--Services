'use strict';

/**
 * Returns Express middleware that validates req.body against a Joi schema.
 * Responds with 400 if validation fails.
 * @param {import('joi').Schema} schema - Joi schema
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => d.message).join('; ');
    return res.status(400).json({ success: false, message: details });
  }
  req.body = value;
  return next();
};

module.exports = validate;
