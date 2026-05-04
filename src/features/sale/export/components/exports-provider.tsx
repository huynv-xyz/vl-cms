import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { Export } from "../data/schema"

const ctx = createCrudDialogContext<Export>("useExports")

export const ExportsProvider = ctx.Provider
export const useExports = ctx.useCrudDialog