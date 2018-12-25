const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author {
    name: String!
  }

  type Book implements Document {
    title: String
  }
`
