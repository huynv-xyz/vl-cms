import type { Customer } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const customerDialogContext = createCrudDialogContext<Customer>("useCustomers")

export const CustomersProvider = customerDialogContext.Provider
export const useCustomers = customerDialogContext.useCrudDialog