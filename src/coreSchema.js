const graphql = require('./taggedNoop')

module.exports = graphql`
  directive @display(title: String, icon: String, layout: String) on FIELD_DEFINITION | OBJECT
  directive @fieldsets(from: [SanitySchemaFieldSet!]!) on OBJECT
  directive @fieldset(set: String!) on FIELD_DEFINITION
  directive @orderings(from: [SanitySchemaOrdering!]!) on OBJECT

  directive @hotspot on FIELD_DEFINITION
  directive @inline on FIELD_DEFINITION
  directive @hidden on FIELD_DEFINITION
  directive @readOnly on FIELD_DEFINITION

  # String directives
  directive @enum(
    values: [SanityNameTitlePair!]!
    layout: String
    direction: String
  ) on FIELD_DEFINITION

  # Image / file directives
  directive @extract(metadata: [String!]!, originalFilename: Boolean) on FIELD_DEFINITION

  # Block directives
  directive @block(
    styles: [SanityNameTitlePair!]
    decorators: [SanityNameTitlePair!]
    annotations: String
  ) on OBJECT

  scalar Number
  scalar Email
  scalar Text
  scalar Date
  scalar DateTime
  scalar Urls

  type SanityNameTitlePair {
    name: String!
    title: String
  }

  type SanitySchemaFieldSet {
    name: String!
    title: String!
    collapsible: Boolean
    collapsed: Boolean
  }

  type SanitySchemaOrdering {
    name: String!
    title: String!
    by: [SanitySchemaSortOrder!]!
  }

  type SanitySchemaSortOrder {
    field: String!
    direction: String!
  }

  interface Document {
    _id: ID!
    _type: String!
    _createdAt: DateTime!
    _updatedAt: DateTime!
    _rev: String!
  }

  interface Image {
    _key: String
    _type: String
    asset: SanityImageAsset
    hotspot: SanityImageHotspot
    crop: SanityImageCrop
  }

  interface File {
    _key: String
    _type: String
    asset: SanityFileAsset
  }

  type Geopoint {
    _key: String
    _type: String
    lat: Float
    lng: Float
    alt: Float
  }

  type SanityFileAsset implements Document {
    _id: ID!
    _type: String!
    _createdAt: DateTime!
    _updatedAt: DateTime!
    _rev: String!
    originalFilename: String
    label: String
    sha1hash: String
    extension: String
    mimeType: String
    size: Float
    assetId: String
    path: String!
    url: String!
  }

  type SanityImageAsset implements Document {
    _id: ID!
    _type: String!
    _createdAt: DateTime!
    _updatedAt: DateTime!
    _rev: String!
    originalFilename: String
    label: String
    sha1hash: String
    extension: String
    mimeType: String
    size: Float
    assetId: String
    path: String!
    url: String!
    metadata: SanityImageMetadata
  }

  type SanityImageCrop {
    _key: String
    _type: String
    top: Float
    bottom: Float
    left: Float
    right: Float
  }

  type SanityImageDimensions {
    _key: String
    _type: String
    height: Float
    width: Float
    aspectRatio: Float
  }

  type SanityImageHotspot {
    _key: String
    _type: String
    x: Float
    y: Float
    height: Float
    width: Float
  }

  type SanityImageMetadata {
    _key: String
    _type: String
    location: Geopoint
    dimensions: SanityImageDimensions
    palette: SanityImagePalette
    lqip: String
  }

  type SanityImagePalette {
    _key: String
    _type: String
    darkMuted: SanityImagePaletteSwatch
    lightVibrant: SanityImagePaletteSwatch
    darkVibrant: SanityImagePaletteSwatch
    vibrant: SanityImagePaletteSwatch
    dominant: SanityImagePaletteSwatch
    lightMuted: SanityImagePaletteSwatch
    muted: SanityImagePaletteSwatch
  }

  type SanityImagePaletteSwatch {
    _key: String
    _type: String
    background: String
    foreground: String
    population: Float
    title: String
  }

  type Slug {
    _key: String
    _type: String
    current: String
  }

  type Block {
    _key: String
    _type: String
    spans: [Span!]
    markDefs: [SpanMark!]
    style: String
    list: String
  }

  interface SpanMark {
    _key: String!
  }

  type Span {
    _key: String
    _type: String
    text: String
    marks: [String!]
  }
`
