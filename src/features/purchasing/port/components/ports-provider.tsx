import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import { Port } from "../data/schema"

const ctx = createCrudDialogContext<Port>("usePorts")

export const PortsProvider = ctx.Provider
export const usePorts = ctx.useCrudDialog