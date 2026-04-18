import type { VipPointRule } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const vipPointRuleDialogContext =
    createCrudDialogContext<VipPointRule>("useVipPointRules")

export const VipPointRulesProvider = vipPointRuleDialogContext.Provider
export const useVipPointRules = vipPointRuleDialogContext.useCrudDialog