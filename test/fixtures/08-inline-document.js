const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author implements Document {
    name: String!
  }

  type Book implements Document {
    title: String
    author: Author! @inline
  }
`
