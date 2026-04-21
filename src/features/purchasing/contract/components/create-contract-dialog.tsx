import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createContract,
    type CreateContractRequest,
} from "@/api/purchasing/contract"
import {
    contractSchema,
    contractUiSchema,
} from "./contract-form-schema"
import type { ContractFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateContractDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<ContractFormValues, CreateContractRequest, unknown>
            title="Tạo hợp đồng"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={contractSchema}
            uiSchema={contractUiSchema}
            defaultValues={{
                code: "",
                supplier_id: 0,
                signed_date: "",
                currency_id: 1,

                payment_method: "TT",

                deposit_rate: 0,
                deposit_date: "",

                vat_rate: 0,
                import_tax_rate: 0,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["contracts"]}
            mutationFn={createContract}
            mapFormToRequest={(v) => ({
                code: v.code,
                supplier_id: v.supplier_id,
                signed_date: v.signed_date,
                currency_id: v.currency_id,
                payment_method: v.payment_method ?? "TT",
                term: v.term ?? "",
                deposit_rate: v.deposit_rate ?? 0,
                deposit_date: v.deposit_date || '',

                vat_rate: v.vat_rate ?? 0,
                import_tax_rate: v.import_tax_rate ?? 0,

            })}
        />
    )
}