import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import { Payment } from "../data/schema"

const ctx = createCrudDialogContext<Payment>("usePayments")

export const PaymentsProvider = ctx.Provider
export const usePayments = ctx.useCrudDialog