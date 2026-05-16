import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { ProductBom } from "../data/schema"

const ctx = createCrudDialogContext<ProductBom>("useProductBoms")

export const ProductBomsProvider = ctx.Provider
export const useProductBoms = ctx.useCrudDialog
