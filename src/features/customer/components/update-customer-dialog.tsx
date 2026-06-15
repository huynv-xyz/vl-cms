import { useState } from "react"

import {
    updateCustomer,
    type UpdateCustomerRequest,
} from "@/api/customer"
import { Button } from "@/components/ui/button"
import type { Customer } from "../data/schema"
import { CustomerAliasDialog } from "./customer-alias-dialog"
import { CustomerEditorDialog } from "./customer-editor-dialog"

type Props = {
    customer: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateCustomerDialog({
    customer,
    open,
    onOpenChange,
}: Props) {
    const alias = customer.default_alias
    const [aliasDialogOpen, setAliasDialogOpen] = useState(false)
    const hasMultipleAliases = Number(customer.alias_count ?? 0) > 1

    return (
        <>
            <CustomerEditorDialog<UpdateCustomerRequest, unknown>
                title="Cập nhật khách hàng"
                open={open}
                onOpenChange={(next) => {
                    if (!next) setAliasDialogOpen(false)
                    onOpenChange(next)
                }}
                defaultValues={{
                    code: customer.code,
                    name: customer.name,
                    address: customer.address ?? "",
                    type: customer.type,
                    region: customer.region,
                    employee_id: customer.employee_id,
                    note: customer.note ?? "",
                    status: customer.status === 1,
                    invoice_alias_code: alias?.alias_code ?? customer.code,
                    invoice_alias_name: alias?.alias_name ?? customer.name,
                    invoice_tax_code: alias?.tax_code ?? customer.tax_code ?? "",
                    invoice_address: alias?.note ?? customer.address ?? "",
                    bank_account: alias?.bank_account ?? "",
                    bank_account_name: alias?.bank_account_name ?? "",
                    bank_name: alias?.bank_name ?? "",
                }}
                invoiceSectionOverride={
                    hasMultipleAliases ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 px-4 py-3">
                            <div className="text-sm text-slate-600">
                                Khách hàng này có {customer.alias_count} thông tin xuất HĐ. Vui lòng quản lý trong danh sách riêng.
                            </div>
                            <Button type="button" variant="outline" onClick={() => setAliasDialogOpen(true)}>
                                Thông tin xuất HĐ
                            </Button>
                        </div>
                    ) : undefined
                }
                submitText="Lưu"
                loadingText="Đang lưu..."
                mutationFn={updateCustomer}
                mapFormToRequest={(values) => ({
                    id: customer.id,
                    code: values.code,
                    name: values.name,
                    address: values.address?.trim() ? values.address.trim() : "",
                    type: values.type,
                    region: values.region,
                    employee_id: values.employee_id,
                    note: values.note?.trim() ? values.note.trim() : "",
                    status: values.status === false ? 0 : 1,
                    invoice_alias_code: values.invoice_alias_code?.trim() || values.code.trim(),
                    invoice_alias_name: values.invoice_alias_name?.trim() || values.name.trim(),
                    invoice_tax_code: values.invoice_tax_code?.trim() || undefined,
                    invoice_address: values.invoice_address?.trim() || undefined,
                    bank_account: values.bank_account?.trim() || undefined,
                    bank_account_name: values.bank_account_name?.trim() || undefined,
                    bank_name: values.bank_name?.trim() || undefined,
                })}
            />
            <CustomerAliasDialog
                customer={customer}
                open={aliasDialogOpen}
                onOpenChange={setAliasDialogOpen}
            />
        </>
    )
}
