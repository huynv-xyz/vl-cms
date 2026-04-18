import type { Contract } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Contract>("useContracts")

export const ContractsProvider = ctx.Provider
export const useContracts = ctx.useCrudDialog