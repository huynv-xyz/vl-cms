export function formSchemaTemplate({ Entity }) {
    return `
export const ${Entity.toLowerCase()}Schema = {
    type: "object",
    properties: {
        code: { type: "string", title: "Code" },
        name: { type: "string", title: "Name" },
    },
}

export const ${Entity.toLowerCase()}UiSchema = {}
`
}