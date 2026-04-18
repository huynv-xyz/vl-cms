import type { VipTier } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const vipTierDialogContext =
    createCrudDialogContext<VipTier>("useVipTiers")

export const VipTiersProvider = vipTierDialogContext.Provider
export const useVipTiers = vipTierDialogContext.useCrudDialog