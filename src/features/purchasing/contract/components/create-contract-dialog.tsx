import {
    createContract,
    type CreateContractRequest,
} from "@/api/purchasing/contract"
import { ContractEditorDialog } from "./contract-editor-dialog"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateContractDialog({ open, onOpenChange }: Props) {
    return (
        <ContractEditorDialog<CreateContractRequest, unknown>
            title="Tạo hợp đồng mua hàng"
            open={open}
            onOpenChange={onOpenChange}
            defaultValues={{
                code: "",
                status: "DRAFT",
                supplier_id: undefined,
                signed_date: "",
                currency_id: 1,
                exchange_rate: 1,
                payment_method: "TT",
                term: "",
                deposit_rate: 0,
                deposit_date: "",
                vat_rate: 0,
                import_tax_rate: 0,
                handling_fee: 0,
            }}
            submitText="Tạo hợp đồng"
            loadingText="Đang tạo..."
            mutationFn={createContract}
            mapFormToRequest={(v) => ({
                code: v.code,
                status: v.status || "DRAFT",
                supplier_id: v.supplier_id,
                signed_date: v.signed_date,
                currency_id: v.currency_id,
                exchange_rate: v.exchange_rate ?? 1,
                payment_method: v.payment_method ?? "TT",
                term: v.term ?? "",
                deposit_rate: v.deposit_rate ?? 0,
                deposit_date: v.deposit_date || "",
                vat_rate: v.vat_rate ?? 0,
                import_tax_rate: v.import_tax_rate ?? 0,
                handling_fee: v.handling_fee ?? 0,
            })}
        />
    )
}
