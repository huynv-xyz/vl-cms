import type { ProductionOrder } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<ProductionOrder>("useProductions")

export const ProductionsProvider = ctx.Provider
export const useProductions = ctx.useCrudDialog