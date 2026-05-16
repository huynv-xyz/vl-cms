import type { PermissionRow } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<PermissionRow>("useAccessPermissions")

export const PermissionsProvider = ctx.Provider
export const useAccessPermissions = ctx.useCrudDialog
