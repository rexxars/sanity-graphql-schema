const compileSchema = require('./compileSchema')

const placeholderSdl = 'type NoTypesDefined implements Document {pleaseFix: String}'
const getPluginTypes = () => require('all:part:@sanity/base/schema-type')

module.exports = function fromGQL(sdl, opts = {}) {
  const externalTypes = opts.externalTypes || getPluginTypes()
  const throwOnError = opts.throwOnError || false
  const schemaSdl = `${sdl}`.trim() || placeholderSdl

  try {
    return compileSchema(schemaSdl, {externalTypes})
  } catch (err) {
    if (throwOnError) {
      throw err
    }

    // eslint-disable-next-line no-console
    console.error(err)
    return [
      {
        name: 'gqlSchemaErrorCheckConsoleForDetails',
        title: 'GQL schema error - check console for details',
        type: 'object',
        fields: []
      }
    ]
  }
}
