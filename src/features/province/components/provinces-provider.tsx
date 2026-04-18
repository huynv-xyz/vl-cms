
import type { Province } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Province>("useProvinces")

export const ProvincesProvider = ctx.Provider
export const useProvinces = ctx.useCrudDialog
