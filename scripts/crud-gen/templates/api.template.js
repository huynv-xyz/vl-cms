export function apiTemplate({ Entity, entity, plural }) {
    return `
import { createCrudApi } from "@/api/crud"
import type { ${Entity} } from "@/features/${entity}/data/schema"

export type ${Entity}ListParams = {
    page: number
    size: number
    keyword?: string
}

export type Create${Entity}Request = Partial<${Entity}>

export type Update${Entity}Request = ${Entity}

const ${entity}Api = createCrudApi<
    ${Entity},
    Create${Entity}Request,
    Update${Entity}Request,
    ${Entity}ListParams
>("/${plural}")

export const list${Entity}s = ${entity}Api.list
export const create${Entity} = ${entity}Api.create
export const update${Entity} = ${entity}Api.update
export const delete${Entity} = ${entity}Api.delete
`
}