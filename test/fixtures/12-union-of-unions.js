const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  union User = Reviewer | Author
  union Work = Book | Magazine
  union Entity = User | Work

  type Reviewer implements Document {
    name: String!
    joined: Date
  }

  type Author implements Document {
    name: String!
    firstPublished: Date
  }

  type Book implements Document {
    title: String
    author: Author
    reviewer: User
  }

  type Magazine implements Document {
    title: String
    attachedTo: Entity
  }
`
