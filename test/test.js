/* eslint-disable no-sync */
const fs = require('fs')
const path = require('path')
const fromGql = require('../src/fromGQL')

const defaultOptions = {externalTypes: [], throwOnError: true}
const fixturesDir = path.join(__dirname, 'fixtures')
const fixture = (sdl, opts = defaultOptions) => fromGql(sdl, opts)

const files = fs.readdirSync(fixturesDir)
files
  .filter(file => /^\d+/.test(file) && file.endsWith('.js'))
  .map(file => ({name: file.slice(0, -3), path: path.join(fixturesDir, file)}))
  .map(file => ({...file, content: require(file.path)}))
  .forEach(file => test(file.name, () => expect(fixture(file.content)).toMatchSnapshot()))
