const Joi = require('joi')

const schema = Joi.object({
  fullname: Joi.string().required().min(2).max(30),
  email: Joi.string().required().email(),
  phone: Joi.string().required(),
  country: Joi.string().required(),
  postal_code: Joi.string().required(),
  address: Joi.string().required(),
  order_items: Joi.string().required(),
  height: Joi.string().optional().allow(''),
  weight: Joi.string().optional().allow(''),
  measurements: Joi.string().optional().allow(''),
  message: Joi.string().optional().allow('')
})

const validateOrderInput = (data) => {
  const { error } = schema.validate(data, { abortEarly: false })
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message)
    return {
      data,
      result: false,
      count: error.details.length,
      errors: errorMessages
    }
  }
  return {
    result: true,
    data
  }
}

module.exports = validateOrderInput
