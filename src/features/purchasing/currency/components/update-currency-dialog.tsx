import { updateCurrency, type UpdateCurrencyRequest } from "@/api/purchasing/currency"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import type { Currency } from "../data/schema"
import { currencySchema, currencyUiSchema } from "./currency-form-schema"
import type { CurrencyFormValues } from "./types"

type Props = {
    currency: Currency
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateCurrencyDialog({ currency, open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<CurrencyFormValues, UpdateCurrencyRequest, unknown>
            title="Cập nhật tiền tệ"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={currencySchema}
            uiSchema={currencyUiSchema}
            defaultValues={{
                code: currency.code ?? "",
                name: currency.name ?? "",
                symbol: currency.symbol ?? "",
                exchange_rate: currency.exchange_rate ?? 1,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["currencies"]}
            mutationFn={updateCurrency}
            mapFormToRequest={(values) => ({
                id: currency.id,
                code: values.code.trim().toUpperCase(),
                name: values.name.trim(),
                symbol: values.symbol?.trim(),
                exchange_rate: Number(values.exchange_rate || 1),
            })}
        />
    )
}
