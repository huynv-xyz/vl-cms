import type { VipPrivateRule } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const ctx = createCrudDialogContext<VipPrivateRule>("useVipPrivateRules")

export const VipPrivateRulesProvider = ctx.Provider
export const useVipPrivateRules = ctx.useCrudDialog