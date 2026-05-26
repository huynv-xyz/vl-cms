import type { VipProductMapping } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const vipProductMappingDialogContext =
    createCrudDialogContext<VipProductMapping>("useVipProductMappings")

export const VipProductMappingsProvider = vipProductMappingDialogContext.Provider
export const useVipProductMappings = vipProductMappingDialogContext.useCrudDialog
