const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Reviewer implements Document {
    name: String!
    joined: Date
  }

  type Author implements Document {
    name: String!
    firstPublished: Date
  }

  union User = Reviewer | Author

  type Book implements Document {
    title: String
    author: Author
    reviewer: User
    descisionMaker: User!
  }
`
