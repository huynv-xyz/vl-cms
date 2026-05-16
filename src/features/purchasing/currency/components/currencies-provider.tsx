import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import type { Currency } from "../data/schema"

const ctx = createCrudDialogContext<Currency>("useCurrencies")

export const CurrenciesProvider = ctx.Provider
export const useCurrencies = ctx.useCrudDialog
