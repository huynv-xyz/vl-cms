import { createCurrency, type CreateCurrencyRequest } from "@/api/purchasing/currency"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { currencySchema, currencyUiSchema } from "./currency-form-schema"
import type { CurrencyFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateCurrencyDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<CurrencyFormValues, CreateCurrencyRequest, unknown>
            title="Tạo tiền tệ"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={currencySchema}
            uiSchema={currencyUiSchema}
            defaultValues={{
                code: "",
                name: "",
                symbol: "",
                exchange_rate: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["currencies"]}
            mutationFn={createCurrency}
            mapFormToRequest={(values) => ({
                code: values.code.trim().toUpperCase(),
                name: values.name.trim(),
                symbol: values.symbol?.trim(),
                exchange_rate: Number(values.exchange_rate || 1),
            })}
        />
    )
}
