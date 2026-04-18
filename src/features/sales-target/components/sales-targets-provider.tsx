import type { SalesTarget } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const salesTargetDialogContext = createCrudDialogContext<SalesTarget>("useSalesTargets")

export const SalesTargetsProvider = salesTargetDialogContext.Provider
export const useSalesTargets = salesTargetDialogContext.useCrudDialog