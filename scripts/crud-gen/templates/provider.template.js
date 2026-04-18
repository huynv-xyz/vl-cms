export function providerTemplate({ Entity }) {
    return `
import type { ${Entity} } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<${Entity}>("use${Entity}s")

export const ${Entity}sProvider = ctx.Provider
export const use${Entity}s = ctx.useCrudDialog
`
}