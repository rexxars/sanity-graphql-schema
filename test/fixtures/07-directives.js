const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author implements Document {
    name: String!
    birthDate: Date @hidden
  }

  type Book implements Document {
    title: String
    author: Author
    tags: [String!]! @display(layout: "tags")
  }
`
