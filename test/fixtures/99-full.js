const graphql = require('../../src/taggedNoop')

module.exports = graphql`
  """
  A blog post

  It can contain newlines
  """
  type Post implements Document @display(title: "Blog post", icon: "post") {
    title: String
    leadImage: CaptionedImage @hotspot
    author: Author!
    body: Text
    tags: [String] @display(layout: "tags")
    status: String @enum(values: [{name: "active"}, {name: "disabled"}], layout: "radio")
    views: Int @readOnly @hidden
    """
    Comments are sent from the frontend
    """
    comments: [Comment] @display(title: "User comments")
  }

  type Author implements Document
    @orderings(
      from: [
        {
          title: "Release Date"
          name: "releaseDateDesc"
          by: [{field: "releaseDate.utc", direction: "desc"}]
        }
      ]
    ) {
    name: String
    profileImage: Image
  }

  type User implements Document {
    name: String
  }

  type CaptionedImage implements Image {
    caption: String
    uploadedBy: Author @inline
  }

  type Comment implements Document @fieldsets(from: [{title: "Statistics", name: "stats"}]) {
    """
    Author of this comment
    """
    author: Author!
    text: String
    likes: Int @fieldset(set: "stats")
    likedBy: [User]
  }

  union Person = Author | User
`
