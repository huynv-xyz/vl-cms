import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { SalaryAdjustmentItem } from "../data/schema"

const ctx = createCrudDialogContext<SalaryAdjustmentItem>("useAdjustments")
export const AdjustmentsProvider = ctx.Provider
export const useAdjustments = ctx.useCrudDialog
