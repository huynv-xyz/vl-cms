import type { Order } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Order>("useOrders")

export const OrdersProvider = ctx.Provider
export const useOrders = ctx.useCrudDialog