const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author {
    num: Float
    name: String!
    slug: Slug
  }
`
