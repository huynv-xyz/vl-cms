import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { PhysicalWarehouse } from "../data/schema"

const ctx = createCrudDialogContext<PhysicalWarehouse>("usePhysicalWarehouses")

export const PhysicalWarehousesProvider = ctx.Provider
export const usePhysicalWarehouses = ctx.useCrudDialog
