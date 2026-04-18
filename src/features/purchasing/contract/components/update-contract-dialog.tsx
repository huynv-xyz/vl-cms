import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateContract,
    type UpdateContractRequest,
} from "@/api/purchasing/contract"
import type { Contract } from "../data/schema"
import { contractSchema, contractUiSchema } from "./contract-form-schema"
import type { ContractFormValues } from "./types"

type Props = {
    contract: Contract
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateContractDialog({
    contract,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<ContractFormValues, UpdateContractRequest, unknown>
            key={contract?.id}
            title="Cập nhật hợp đồng"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={contractSchema}
            uiSchema={contractUiSchema}
            defaultValues={{
                code: contract.code || "",
                supplier_id: contract.supplier_id || 0,
                signed_date: contract.signed_date || "",
                currency_id: contract.currency_id || 1,

                payment_method: contract.payment_method ?? "TT",

                deposit_rate: contract.deposit_rate ?? 0,
                deposit_date: contract.deposit_date || "",

                vat_rate: contract.vat_rate ?? 0,
                import_tax_rate: contract.import_tax_rate ?? 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["contracts"]}
            mutationFn={updateContract}
            mapFormToRequest={(v) => ({
                id: contract.id,

                code: v.code,
                supplier_id: v.supplier_id,
                signed_date: v.signed_date,
                currency_id: v.currency_id,

                payment_method: v.payment_method ?? "TT",

                deposit_rate: v.deposit_rate ?? 0,
                deposit_date: v.deposit_date || '',

                vat_rate: v.vat_rate ?? 0,
                import_tax_rate: v.import_tax_rate ?? 0,
            })}
        />
    )
}