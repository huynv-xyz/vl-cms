import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipCustomerTarget,
    type CreateVipCustomerTargetRequest,
} from "@/api/vip-customer-target"

import { vipCustomerTargetSchema, vipCustomerTargetUiSchema } from "./vip-customer-target-form-schema"
import type { VipCustomerTargetFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipCustomerTargetDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipCustomerTargetFormValues, CreateVipCustomerTargetRequest, unknown>
            title="Tạo chỉ tiêu khách hàng"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipCustomerTargetSchema}
            uiSchema={vipCustomerTargetUiSchema}
            defaultValues={{
                calc_year: new Date().getFullYear(),
                customer_code: "",
                customer_name: "",
                target_tier_code: "",
                target_tier_name: "",
                note: "",
                status: true,
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            successMessage="Tạo chỉ tiêu khách hàng thành công"
            errorMessage="Tạo chỉ tiêu khách hàng thất bại"
            queryKeyToInvalidate={["vip-customer-target"]}
            mutationFn={createVipCustomerTarget}
            mapFormToRequest={(values) => ({
                calc_year: values.calc_year,
                customer_code: values.customer_code,
                customer_name: values.customer_name ?? "",
                target_tier_code: values.target_tier_code ?? "",
                target_tier_name: values.target_tier_name ?? values.target_tier_code ?? "",
                note: values.note ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
