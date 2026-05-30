import type { Company } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Company>("useCompanies")

export const CompaniesProvider = ctx.Provider
export const useCompanies = ctx.useCrudDialog
