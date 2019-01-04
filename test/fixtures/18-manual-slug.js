const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author {
    name: String!
    description: String
    slug: Slug @slug(source: "description")
  }
`
