import type { AccessRole } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<AccessRole>("useAccessRoles")

export const RolesProvider = ctx.Provider
export const useAccessRoles = ctx.useCrudDialog
