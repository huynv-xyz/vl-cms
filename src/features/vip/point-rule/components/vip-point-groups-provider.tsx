import type { VipPointGroup } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const vipPointGroupDialogContext =
    createCrudDialogContext<VipPointGroup>("useVipPointGroups")

export const VipPointGroupsProvider = vipPointGroupDialogContext.Provider
export const useVipPointGroups = vipPointGroupDialogContext.useCrudDialog
