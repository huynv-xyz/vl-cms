export function schemaTemplate({ Entity }) {
    return `
export type ${Entity} = {
    id: number
    code: string
    name: string
    status: number
    created_at?: string
    updated_at?: string
}
`
}