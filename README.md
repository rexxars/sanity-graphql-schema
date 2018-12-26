# sanity-graphql-schema

Declare a [Sanity](https://www.sanity.io/) schema using GraphQL SDL syntax.

- Auto-infers title from type/field names (`leadAsset` -> `Lead asset`)
- Type names are automatically camelcased (`BlogPost` -> `blogPost`)
- Types that implement "Document" is made into document types
- Document types as field type assumed to be references, object types as inline
  - Use `@inline` directive to use document type embedded into parent document
- Directives for most schema type options
- "Non null" treated as "required" validation rule (only enforced in Studio)

## Installation

```
# In your Sanity studio folder
yarn add sanity-graphql-schema
```

## Basic usage

In your schema entry point (usually `schemas/schema.js`), you normally have something along the lines of this:

```js
import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'

import author from './author'

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([author])
})
```

To use this module, import it, call the imported function with a GraphQL schema defined in the GraphQL schema definition language, and replace the value passed to `createSchema()` with the output:

```js
import createSchema from 'part:@sanity/base/schema-creator'
import {fromGQL, graphql} from 'sanity-graphql-schema'

const schema = graphql`
  type Author implements Document {
    name: String!
    profileImage: Image
  }

  type BlogPost implements Document {
    title: String!
    slug: Slug
    body: Text
    leadImage: CaptionedImage
    tags: [String!]! @display(layout: "tags")
    author: Author!
  }

  type CaptionedImage implements Image {
    caption: String!
  }
`

export default createSchema({
  name: 'default',
  types: fromGQL(schema)
})
```

## Directives

- `@display(title: String, icon: String, layout: String)`
  Allows you to:
  - Set title of fields and types, overriding the auto-generated title
  - Set layout mode for a field (for instance, set `tags` as layout for an array field)
  - Set icon for document types by passing an icon ID (see example below)

* `@fieldsets(from: [SanitySchemaFieldSet!]!)`
  Set the fieldsets available for an object/document type. Takes an array of `{name, title}` pairs

* `@fieldset(set: String!)`
  Assign a field to a given fieldset

* `@orderings(from: [SanitySchemaOrdering!]!)`
  Set the available ordering options for a document type.
  Takes an array of `{name, title, by}` pairs - see [Sanity documentation](https://www.sanity.io/docs/the-schema/sort-orders) for more information

- `@enum(values: [SanityNameTitlePair!]!, layout: String, direction: String)`
  Set on string fields if you only want to allow certain values.
  - `values` takes an array of `{name, title}` pairs.
  - `layout` can be one of `dropdown` or `radio`, `dropdown` being the default.
  - `direction` determines which way radio buttons flow (`horizontal`, `vertical`)

* `@extract(metadata: [String!]!, originalFilename: Boolean)`
  Set on fields of type `Image` or `File` to determine which metadata to extract, and whether or not to store the original filename

* `@hotspot`
  Set on image fields to opt-in to the hotspot/crop functionality

* `@inline`
  Set on fields that use a document type as it's value if you want to embed the value instead of referencing an existing document

* `@hidden`
  Set on fields to hide them from the user interface, yet still be recognized by the underlying schema machinery

* `@readOnly`
  Set on fields to that should not be editable from the studio

## Todo

- [x] Generate GQL types for custom types (color input, for instance)
- [x] Custom scalars (`markdown`)
- [x] Throw on non-reference union fields
- [x] Better error handling
- [x] Blocks/spans
- [ ] Validation directives
- [ ] Inject icons, input components as options argument
- [ ] JSON scalar for arbitrary input for custom types? Or options as dotpath? Both?

## Developing

```bash
git clone git@github.com:rexxars/sanity-graphql-schema.git
cd sanity-graphql-schema
npm install
npm test
```

## License

MIT © [Espen Hovlandsdal](https://espen.codes/)
