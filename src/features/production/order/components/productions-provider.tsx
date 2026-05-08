import type { Production } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Production>("useProductions")

export const ProductionsProvider = ctx.Provider
export const useProductions = ctx.useCrudDialog