
import type { ArLedger } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<ArLedger>("useArLedgers")

export const ArLedgersProvider = ctx.Provider
export const useArLedgers = ctx.useCrudDialog
