import {
    updateContract,
    type UpdateContractRequest,
} from "@/api/purchasing/contract"
import type { Contract } from "../data/schema"
import { ContractEditorDialog } from "./contract-editor-dialog"

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
        <ContractEditorDialog<UpdateContractRequest, unknown>
            title="Cập nhật hợp đồng mua hàng"
            open={open}
            onOpenChange={onOpenChange}
            defaultValues={{
                code: contract.code ?? "",
                status: contract.status ?? "DRAFT",
                supplier_id: contract.supplier_id ?? undefined,
                signed_date: normalizeDate(contract.signed_date),
                currency_id: contract.currency_id ?? undefined,
                exchange_rate: contract.exchange_rate ?? contract.currency?.exchange_rate ?? 1,
                payment_method:
                    contract.payment_method &&
                        ["TT", "LC_IMMEDIATE", "LC_60_BL", "DA", "DP"].includes(contract.payment_method)
                        ? contract.payment_method
                        : "TT",
                term: contract.term ?? "",
                deposit_rate: contract.deposit_rate ?? 0,
                deposit_date: normalizeDate(contract.deposit_date),
                vat_rate: contract.vat_rate ?? 0,
                import_tax_rate: contract.import_tax_rate ?? 0,
                handling_fee: contract.handling_fee ?? 0,
            }}
            submitText="Lưu thay đổi"
            loadingText="Đang lưu..."
            mutationFn={updateContract}
            mapFormToRequest={(v) => ({
                id: contract.id,
                code: v.code,
                status: v.status || contract.status || "DRAFT",
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

function normalizeDate(value?: string) {
    if (!value) return ""

    const [datePart] = value.trim().split("T")
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart

    const localDate = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (localDate) {
        const [, day, month, year] = localDate
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ""

    return parsed.toISOString().slice(0, 10)
}
