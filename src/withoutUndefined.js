module.exports = function withoutUndefined(obj) {
  return Object.keys(obj).reduce(
    (acc, key) => (typeof obj[key] === 'undefined' ? acc : {...(acc || {}), [key]: obj[key]}),
    undefined
  )
}
