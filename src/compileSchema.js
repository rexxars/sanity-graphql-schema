const oneline = require('oneline')
const {parse, specifiedScalarTypes, valueFromASTUntyped, buildASTSchema} = require('graphql')
const {words, snakeCase, camelCase, upperFirst} = require('lodash')
const coreSchema = require('./coreSchema')
const schemaError = require('./schemaError')
const stubExternalTypes = require('./stubExternalTypes')
const withoutUndefined = require('./withoutUndefined')

const core = parse(coreSchema)
const coreTypeMap = core.definitions.reduce((map, def) => map.set(def.name.value, def), new Map())

const unsupported = ['ScalarTypeDefinition', 'InputObjectTypeDefinition']

module.exports = function compileSchema(userSchema, options) {
  const externalTypes = options.externalTypes || []
  const externalTypesSchema = stubExternalTypes(externalTypes)
  const merged = parse([coreSchema, externalTypesSchema, userSchema].join('\n\n'))
  const external = externalTypesSchema ? parse(externalTypesSchema) : {definitions: []}
  const parsed = parse(userSchema)
  if (merged.kind !== 'Document') {
    return [schemaError('Could not parse GraphQL schema, expected kind `Document` at root')]
  }

  // Build schema to validate it
  const schema = buildASTSchema(merged)

  const externalTypeMap = external.definitions.reduce(
    (map, def) => map.set(def.name.value, def),
    new Map()
  )

  const defs = parsed.definitions || []
  const userTypeMap = new Map()
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i]
    if (unsupported.includes(def.kind)) {
      return [schemaError(`Unsupported node of kind ${def.kind} found`)]
    }

    userTypeMap.set(def.name.value, def)
  }

  const opts = {schema, icons: {}}
  const typeMap = new Map([...userTypeMap, ...externalTypeMap, ...coreTypeMap])
  const sanityTypes = []
  for (const def of userTypeMap.values()) {
    const sanityType = convertType(def, typeMap, opts)
    if (sanityType) {
      sanityTypes.push(sanityType)
    }
  }

  return externalTypes.concat(sanityTypes)
}

function titleCase(str) {
  const [first, ...rest] = words(snakeCase(str))
  return [upperFirst(first), ...rest].join(' ')
}

function isCoreScalar(typeName) {
  return specifiedScalarTypes.some(scalar => scalar.name === typeName)
}

function isScalar(typeName, map) {
  if (isCoreScalar(typeName)) {
    return true
  }

  const type = map.get(typeName)
  return type && isScalarTypeDef(type)
}

function isScalarTypeDef(def) {
  return def.kind === 'ScalarTypeDefinition'
}

function isInterface(def) {
  return def.kind === 'InterfaceTypeDefinition'
}

function isUnion(def) {
  return def && def.kind === 'UnionTypeDefinition'
}

function isDocument(def) {
  return def.interfaces && def.interfaces.some(iface => iface.name.value === 'Document')
}

function isArgument(node) {
  return node.kind === 'Argument'
}

function typeImplementsInterface(type, ifaceName) {
  if (!type) {
    return false
  }

  if (isInterface(type) && type.name.value === ifaceName) {
    return true
  }

  return type.interfaces && type.interfaces.some(iface => iface.name.value === ifaceName)
}

function getUnwrappedType(typeDef, map) {
  const unwrapFor = ['NonNullType', 'ListType']
  const type = unwrapFor.includes(typeDef.kind) ? typeDef.type : typeDef
  if (unwrapFor.includes(type.kind)) {
    return getUnwrappedType(type, map)
  }

  if (type.kind !== 'NamedType') {
    throw new Error(oneline`
      Expected unwrapped type to be of kind "NamedType", got "${type.kind}"
    `)
  }

  if (isCoreScalar(type.name.value)) {
    return {
      kind: 'NamedType',
      name: {kind: 'Name', value: type.name.value}
    }
  }

  return map.get(type.name.value)
}

function getDirectives(def) {
  return (def.directives || []).reduce(
    (acc, dir) => ({
      ...acc,
      [dir.name.value]: dir.arguments
        .filter(isArgument)
        .reduce((args, arg) => ({...args, [arg.name.value]: valueFromASTUntyped(arg.value)}), {})
    }),
    {display: {}}
  )
}

function convertType(def, ...args) {
  switch (def.kind) {
    case 'ObjectTypeDefinition':
      return convertObjectType(def, ...args)
    case 'UnionTypeDefinition':
      return null
    default:
      return schemaError(`Unhandled node kind "${def.kind}"`)
  }
}

function flattenUnionType(def, map) {
  return def.types.reduce((types, typeDef) => {
    const type = map.get(typeDef.name.value) || typeDef
    return isUnion(type) ? [...types, ...flattenUnionType(type, map)] : [...types, type]
  }, [])
}

function convertObjectType(def, map, options) {
  const typeName = def.name.value

  if (coreTypeMap.has(typeName)) {
    return schemaError(
      oneline`
      "${typeName}" is a bundled type, please use a different name`,
      typeName
    )
  }

  if (def.interfaces.length > 1) {
    return schemaError(
      oneline`
        Tried to implement multiple interfaces, only a single interface is allowed
      `,
      typeName
    )
  }

  let type = 'object'
  if (def.interfaces[0]) {
    const iface = map.get(def.interfaces[0].name.value)
    if (!iface) {
      return schemaError(
        oneline`
        Tried to implement interface "${def.interfaces[0].name.value}",
        which is not defined`,
        typeName
      )
    }

    if (!isInterface(iface)) {
      return schemaError(
        `Tried to implement "${iface.name.value}", which is not an interface`,
        typeName
      )
    }

    type = camelCase(iface.name.value)
  }

  const directives = getDirectives(def)
  const {display, fieldsets, orderings} = directives
  const {icons} = options

  return withoutUndefined({
    name: camelCase(typeName),
    title: display.title || titleCase(def.name.value),
    type,
    description: def.description && def.description.value,
    icon: icons[display.icon],
    fields: def.fields.map(field => convertField(field, map, {...options, parent: def})),
    orderings: orderings && orderings.from,
    fieldsets: fieldsets && fieldsets.from
  })
}

function optionsFromDirectives(type, directives, map) {
  const typeName = type.name && type.name.value
  const typeDef = typeName && map.get(typeName)
  const {display, enum: enumDir, extract, hotspot} = directives
  if (typeName === 'String') {
    return {
      list: enumDir && enumDir.values,
      layout: enumDir && enumDir.layout,
      direction: enumDir && enumDir.direction
    }
  }

  if (typeImplementsInterface(typeDef, 'Image')) {
    return {
      metadata: extract && extract.metadata,
      storeOriginalFilename: extract && extract.originalFilename,
      hotspot: Boolean(hotspot) || undefined
    }
  }

  if (typeImplementsInterface(typeDef, 'File')) {
    return {
      storeOriginalFilename: extract && extract.originalFilename
    }
  }

  if (type.kind === 'ListType') {
    return {
      layout: display && display.layout
    }
  }

  return {}
}

function convertArrayField(def, map, options, type, field) {
  const unwrapped = getUnwrappedType(type, map)
  const namedMembers = isUnion(unwrapped) ? flattenUnionType(unwrapped, map) : [unwrapped]
  const members = namedMembers.map(member => map.get(member.name.value) || member)
  const hasScalars = members.some(member => isScalar(member.name.value, map))
  const hasNonScalars = members.some(member => !isScalar(member.name.value, map))
  const hasDocuments = members.some(isDocument)
  const allDocuments = members.every(isDocument)

  if (hasScalars && hasNonScalars) {
    return schemaError(
      oneline`
      Field "${field.name}" on type "${options.parent.name.value}"
      cannot contain both scalar and object types`,
      field.name,
      field
    )
  }

  let ofDef
  const forcedInline = Boolean(getDirectives(def).inline)

  if (hasScalars || forcedInline || !hasDocuments) {
    // [String | Number]
    // [Author | Book] @inline
    // [Image  | ImageWithCaption]
    ofDef = members.map(getFieldDefForNamedType)
  } else if (allDocuments) {
    // [Author | Book]
    ofDef = [{type: 'reference', to: members.map(getFieldDefForNamedType)}]
  } else {
    // [Author | Image]
    const docs = members.filter(isDocument)
    const inline = members.filter(member => !isDocument(member))
    ofDef = [
      {type: 'reference', to: docs.map(getFieldDefForNamedType)},
      ...inline.map(getFieldDefForNamedType)
    ]
  }

  return withoutUndefined({...field, type: 'array', of: ofDef})
}

function convertField(def, map, options) {
  const nonNull = def.type.kind === 'NonNullType'
  const type = nonNull ? def.type.type : def.type
  const name = def.name && def.name.value

  const directives = getDirectives(def)
  const {display, readOnly, hidden, fieldset, enum: enumDir} = directives

  const field = {
    name,
    title: display.title || (name && titleCase(name)),
    description: def.description && def.description.value,
    readOnly: Boolean(readOnly) || undefined,
    hidden: Boolean(hidden) || undefined,
    fieldset: fieldset && fieldset.set,
    options: withoutUndefined(optionsFromDirectives(type, directives, map))
  }

  if (def.arguments && def.arguments.length > 0) {
    return schemaError(`Field arguments are not supported`, name, field)
  }

  if (enumDir && type.name && type.name.value !== 'String') {
    return schemaError(`@enum directive only allowed for String fields`, name, field)
  }

  if (nonNull) {
    field.validation = field.validation
      ? [field.validation, Rule => Rule.required()]
      : Rule => Rule.required()
  }

  if (type.kind === 'ListType') {
    return convertArrayField(def, map, options, type, field)
  }

  if (type.kind === 'NamedType') {
    return convertNamedTypeField(def, map, options, type, field)
  }

  return field
}

function convertNamedTypeField(def, map, options, type, baseField) {
  const name = def.name && def.name.value
  const {parent} = options
  const typeName = type.name.value
  const referencedType = map.get(typeName)

  if (!referencedType && !isCoreScalar(typeName)) {
    return schemaError(
      oneline`
      Field "${name}" on type "${parent.name.value}" is of type "${typeName}",
      which is not a defined type`,
      name,
      baseField
    )
  } else if (!referencedType || isScalar(typeName, map)) {
    return withoutUndefined({...baseField, ...getFieldDefForNamedType(type)})
  }

  const members = isUnion(referencedType) ? flattenUnionType(referencedType, map) : [referencedType]
  const allMembersAreDocuments = members.every(isDocument)
  const shouldInline = Boolean(getDirectives(def).inline) || !allMembersAreDocuments
  const shouldReference = !shouldInline

  // Sanity doesn't support union fields, as such.
  // It does support references to one or more document type, but not "inline" unions.
  if (referencedType && !shouldReference && isUnion(referencedType)) {
    const targets = referencedType.types.map(member => getUnwrappedType(member, map))
    const nonDocTypes = targets
      .filter(member => !isDocument(member))
      .map(member => member.name.value)

    const plural = nonDocTypes.length > 1 ? 'are not document types' : 'is not a document type'
    const help =
      nonDocTypes.length > 0 &&
      `(${nonDocTypes.join(', ')} ${plural} and therefore must be inlined)`

    return schemaError(
      oneline`
        Field "${name}" on type "${parent.name.value}" cannot be
        an inline union ${help || ''}`,
      name,
      baseField
    )
  }

  const fieldDef = getFieldDefForNamedType(type)
  const refOverride = shouldReference
    ? {type: 'reference', to: members.map(getFieldDefForNamedType)}
    : {}

  return withoutUndefined({...baseField, ...fieldDef, ...refOverride})
}

function getFieldDefForNamedType(type) {
  switch (type.name.value) {
    case 'Int':
      return {type: 'number', validation: Rule => Rule.integer()}
    case 'Float':
      return {type: 'number'}
    case 'ID':
      return {type: 'string'}
    default:
      return {type: camelCase(type.name.value)}
  }
}
