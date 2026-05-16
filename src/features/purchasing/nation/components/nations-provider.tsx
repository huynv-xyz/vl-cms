import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { Nation } from "../data/schema"

const ctx = createCrudDialogContext<Nation>("useNations")

export const NationsProvider = ctx.Provider
export const useNations = ctx.useCrudDialog
