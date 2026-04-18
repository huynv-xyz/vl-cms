export function typesTemplate({ Entity }) {
    return `
export type ${Entity}FormValues = {
    code: string
    name: string
    status?: boolean
}
`
}