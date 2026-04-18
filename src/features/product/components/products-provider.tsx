import type { Product } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Product>("useProducts")

export const ProductsProvider = ctx.Provider
export const useProducts = ctx.useCrudDialog