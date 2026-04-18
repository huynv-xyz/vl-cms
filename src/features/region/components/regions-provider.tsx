
import type { Region } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<Region>("useRegions")

export const RegionsProvider = ctx.Provider
export const useRegions = ctx.useCrudDialog
