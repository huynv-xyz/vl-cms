import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { Return } from "../data/schema"

const ctx = createCrudDialogContext<Return>("useReturns")

export const ReturnsProvider = ctx.Provider
export const useReturns = ctx.useCrudDialog