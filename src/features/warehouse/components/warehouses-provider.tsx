import type { Warehouse } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Warehouse>("useWarehouses")

export const WarehousesProvider = ctx.Provider
export const useWarehouses = ctx.useCrudDialog
