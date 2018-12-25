const withoutUndefined = require('./withoutUndefined')

module.exports = function schemaError(message, name = '__root__', base = {}) {
  return withoutUndefined({
    name,
    title: 'GQL schema error',
    type: 'string',
    ...base,
    _problems: [
      {
        severity: 'error',
        message
      }
    ]
  })
}
