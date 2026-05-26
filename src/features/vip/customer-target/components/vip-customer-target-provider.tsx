import type { VipCustomerTarget } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const vipCustomerTargetDialogContext =
    createCrudDialogContext<VipCustomerTarget>("useVipCustomerTargets")

export const VipCustomerTargetsProvider = vipCustomerTargetDialogContext.Provider
export const useVipCustomerTargets = vipCustomerTargetDialogContext.useCrudDialog
