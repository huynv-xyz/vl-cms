import type { InventoryInbound } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<InventoryInbound>("useInventoryInbounds")

export const InventoryInboundsProvider = ctx.Provider
export const useInventoryInbounds = ctx.useCrudDialog