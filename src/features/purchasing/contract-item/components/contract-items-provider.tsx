import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import { ContractItem } from "../data/schema"

const ctx = createCrudDialogContext<ContractItem>("useContractItems", {})

export const ContractItemsProvider = ctx.Provider
export const useContractItems = ctx.useCrudDialog