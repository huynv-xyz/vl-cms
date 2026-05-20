import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { GoodsDescription } from "../data/schema"

const ctx = createCrudDialogContext<GoodsDescription>("useGoodsDescriptions")

export const GoodsDescriptionsProvider = ctx.Provider
export const useGoodsDescriptions = ctx.useCrudDialog
