const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  type Author {
    # GraphQL
    int: Int
    float: Float
    string: String
    bool: Boolean
    id: ID

    # Sanity
    number: Number
    email: Email
    text: Text
    date: Date
    dateTime: DateTime
    url: Url

    # Lists
    list: [String]
    textList: [Text]
  }
`
