import type { Receipt } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Receipt>("useReceipts")

export const ReceiptsProvider = ctx.Provider
export const useReceipts = ctx.useCrudDialog