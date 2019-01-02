const {upperFirst} = require('lodash-es')

module.exports = function stubExternalTypes(types) {
  return types.reduce((sdl, type) => {
    return `${sdl}
    # Stub to make external types work
    scalar ${upperFirst(type.name)} # ${type.name}\n\n`.replace(/(\n+)\s*/g, '$1')
  }, '')
}
