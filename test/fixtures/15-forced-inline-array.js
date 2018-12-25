const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author implements Document {
    name: String!
  }

  type ExternalImage {
    caption: String
    url: Url
  }

  union Description = Author | ExternalImage

  type Book implements Document {
    title: String
    author: Author!
    description: [Description] @inline
  }
`
