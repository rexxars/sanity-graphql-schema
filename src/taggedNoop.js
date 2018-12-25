module.exports = function taggedTemplateNoop(strings, ...keys) {
  const lastIndex = strings.length - 1
  return (
    strings.slice(0, lastIndex).reduce((acc, slice, i) => acc + slice + keys[i], '') +
    strings[lastIndex]
  )
}
