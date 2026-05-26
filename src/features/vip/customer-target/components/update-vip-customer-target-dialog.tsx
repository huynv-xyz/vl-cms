import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipCustomerTarget,
    type UpdateVipCustomerTargetRequest,
} from "@/api/vip-customer-target"

import type { VipCustomerTarget } from "../data/schema"
import { vipCustomerTargetSchema, vipCustomerTargetUiSchema } from "./vip-customer-target-form-schema"
import type { VipCustomerTargetFormValues } from "./types"

type Props = {
    target: VipCustomerTarget
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipCustomerTargetDialog({
    target,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipCustomerTargetFormValues, UpdateVipCustomerTargetRequest, unknown>
            title="Cập nhật chỉ tiêu khách hàng"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipCustomerTargetSchema}
            uiSchema={vipCustomerTargetUiSchema}
            defaultValues={{
                calc_year: target.calc_year,
                customer_code: target.customer_code,
                customer_name: target.customer_name ?? "",
                target_tier_code: target.target_tier_code ?? "",
                target_tier_name: target.target_tier_name ?? "",
                note: target.note ?? "",
                status: target.status === 1,
            }}
            submitText="Lưu"
            loadingText="Đang cập nhật..."
            queryKeyToInvalidate={["vip-customer-target"]}
            mutationFn={updateVipCustomerTarget}
            mapFormToRequest={(values) => ({
                id: target.id,
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
