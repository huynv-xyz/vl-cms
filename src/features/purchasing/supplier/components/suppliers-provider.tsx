import type { Supplier } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Supplier>("useSuppliers")

export const SuppliersProvider = ctx.Provider
export const useSuppliers = ctx.useCrudDialog