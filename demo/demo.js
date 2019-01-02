import React from 'react'
import ReactDOM from 'react-dom'
import {debounce} from 'lodash-es'
import json5 from 'json5'
import {
  UnControlled as UncontrolledCodeMirror,
  Controlled as ControlledCodeMirror
} from 'react-codemirror2'
import compileSchema from '../src/compileSchema'
import 'codemirror-graphql/mode'
import 'codemirror/mode/javascript/javascript'

const defaultSdl = `
union BlockContent = Block | Image

type Post {
  title: String!
  slug: Slug
  author: Author
  mainImage: Image @hotspot
  categories: [Category]
  publishedAt: Datetime
  body: [BlockContent]
}

type Category {
  title: String!
  description: Text
}

type Author {
  name: String!
  slug: Slug
  image: Image @hotspot
  bio: [Block]
}
`

const localStorageKey = 'gqlSchemaSdl'

function getInitialValue() {
  try {
    const saved = window && window.localStorage && window.localStorage.getItem(localStorageKey)
    return saved || defaultSdl
  } catch (err) {
    return defaultSdl
  }
}

function getCompiled(value) {
  let schema
  try {
    const compiled = compileSchema(value, {externalTypes: []})
    schema = json5.stringify(compiled, {space: 2, quote: "'"})
  } catch (err) {
    schema = err.message
  }
  return schema
}

class SanityGraphQLDemo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {schema: getCompiled(props.initialSdl)}
    this.handleChange = this.handleChange.bind(this)
    this.persist = debounce(this.persist.bind(this), 400)
  }

  persist() {
    const currentValue = this.state.currentValue || ''
    try {
      window.localStorage && window.localStorage.setItem(localStorageKey, currentValue)
    } catch (err) {
      // intentional noop
    }
  }

  handleChange(editor, data, value) {
    const schema = getCompiled(value)
    this.setState({schema, currentValue: value})
    this.persist()
  }

  render() {
    return (
      <React.Fragment>
        <UncontrolledCodeMirror
          value={this.props.initialSdl}
          options={{
            mode: 'graphql',
            theme: 'material'
          }}
          onChange={this.handleChange}
        />
        <ControlledCodeMirror
          value={this.state.schema}
          options={{
            mode: 'javascript',
            theme: 'material'
          }}
        />
      </React.Fragment>
    )
  }
}

ReactDOM.render(
  <SanityGraphQLDemo initialSdl={getInitialValue()} />,
  document.getElementById('demo')
)
