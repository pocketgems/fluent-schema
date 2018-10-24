const last = arr => {
  const [prop] = [...arr].reverse()
  return prop
}

const flat = array =>
  array.reduce((memo, prop) => {
    const { name, ...rest } = prop
    return {
      ...memo,
      [name]: rest,
    }
  }, {})

const FluentSchema = (
  schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    definitions: [],
    properties: [],
    required: [],
  }
) => ({
  id: $id => {
    const currentProp = last(schema.properties)
    if (currentProp) {
      const { name, ...props } = currentProp
      return FluentSchema({ ...schema }).prop(name, { ...props, $id })
    }
    return FluentSchema({ ...schema, $id })
  },
  title: title => {
    const currentProp = last(schema.properties)
    if (currentProp) {
      const { name, ...props } = currentProp
      return FluentSchema({ ...schema }).prop(name, { ...props, title })
    }
    return FluentSchema({ ...schema, title })
  },
  description: description => {
    const currentProp = last(schema.properties)
    if (currentProp) {
      const { name, ...props } = currentProp
      return FluentSchema({ ...schema }).prop(name, {
        ...props,
        description,
      })
    }
    return FluentSchema({ ...schema, description })
  },
  ref: $ref => {
    const currentProp = last(schema.properties)
    if (currentProp) {
      const { name } = currentProp
      return FluentSchema({ ...schema }).prop(name, { $ref })
    }
    // TODO LS not sure if a schema can have a $ref
    return FluentSchema({ ...schema, $ref })
  },
  definition: (name, props = {}) =>
    FluentSchema({ ...schema }).prop(name, props, true),

  //TODO LS move 'def' in the props
  prop: (name, props = {}, def = false) => {
    const target = def ? 'definitions' : 'properties'
    const attributes =
      typeof props.title === 'function' ? props.valueOf() : props
    const {
      type = attributes.anyOf || attributes.anyOf || attributes.anyOf
        ? undefined
        : 'string',
      // TODO LS $id should be prefixed with the parent
      $id = `#${target}/${name}`,
      $ref,
      title,
      description,
      defaults,
      properties,
      required,
      anyOf,
      allOf,
      oneOf,
    } = attributes

    return FluentSchema({
      ...schema,
      [target]: [
        ...schema[target],
        $ref
          ? { name, $ref }
          : Object.assign(
              {},
              { name, type },
              defaults ? { default: defaults } : undefined,
              title ? { title } : undefined,
              $id ? { $id } : undefined,
              description ? { description } : undefined,
              properties ? { properties } : undefined,
              required ? { required } : undefined,
              anyOf ? { anyOf } : undefined,
              oneOf ? { oneOf } : undefined,
              allOf ? { allOf } : undefined
            ),
      ],
    })
  },

  anyOf: attributes => {
    const currentProp = last(schema.properties)
    const { name, type, ...props } = currentProp
    const properties = attributes.valueOf().properties
    const values = Object.entries(properties).reduce((memo, [key, value]) => {
      return [...memo, value]
    }, [])
    const attr = {
      ...props,
      anyOf: values,
    }
    return FluentSchema({ ...schema }).prop(name, attr)
  },

  required: () => {
    const currentProp = last(schema.properties)
    return FluentSchema({
      ...schema,
      required: [...schema.required, currentProp.name],
    })
  },
  asNumber: () => FluentSchema({ ...schema }).as('number'),
  asObject: () => FluentSchema({ ...schema }).as('object'),

  as: type => {
    const currentProp = last(schema.properties)
    if (currentProp) {
      const { name, ...props } = currentProp
      return FluentSchema({ ...schema }).prop(name, {
        ...props,
        type,
      })
    }
    return FluentSchema({ ...schema, type })
  },

  valueOf: () => {
    const { properties, definitions, ...rest } = schema
    return {
      definitions: flat(definitions),
      ...rest,
      properties: flat(properties),
    }
  },
})

module.exports = {
  FluentSchema,
}