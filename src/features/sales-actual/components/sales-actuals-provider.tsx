import type { SalesActual } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const salesActualDialogContext =
    createCrudDialogContext<SalesActual>("useSalesActuals")

export const SalesActualsProvider = salesActualDialogContext.Provider
export const useSalesActuals = salesActualDialogContext.useCrudDialog