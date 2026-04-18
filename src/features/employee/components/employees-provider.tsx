import type { Employee } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Employee>("useEmployees")

export const EmployeesProvider = ctx.Provider
export const useEmployees = ctx.useCrudDialog