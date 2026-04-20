import type { Delivery } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Delivery>("useDeliveries")

export const DeliveriesProvider = ctx.Provider
export const useDeliveries = ctx.useCrudDialog