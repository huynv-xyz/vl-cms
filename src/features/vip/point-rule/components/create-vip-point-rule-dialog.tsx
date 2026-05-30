import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipPointRule,
    type CreateVipPointRuleRequest,
} from "@/api/vip-point-rule"

import { vipPointRuleSchema, vipPointRuleUiSchema } from "./vip-point-rule-form-schema"
import type { VipPointRuleFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipPointRuleDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipPointRuleFormValues, CreateVipPointRuleRequest, unknown>
            title="Tạo mới"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipPointRuleSchema}
            uiSchema={vipPointRuleUiSchema}
            defaultValues={{
                vthh_con: "",
                from_value: 0,
                to_value: 0,
                he_so_mb: 0,
                he_so_mn: 0,
                group_code: "",
                nhom_tinh_diem: "",
                unit: "",
                description: "",
                note: "",
                status: true,
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            successMessage="Tạo VIP Point Rule thành công"
            errorMessage="Tạo VIP Point Rule thất bại"
            queryKeyToInvalidate={["vip-point-rule"]}
            mutationFn={createVipPointRule}
            mapFormToRequest={(values) => ({
                vthh_con: values.vthh_con,
                from_value: values.from_value ?? 0,
                to_value: values.to_value ?? 0,
                he_so_mb: values.he_so_mb ?? 0,
                he_so_mn: values.he_so_mn ?? 0,
                group_code: values.group_code ?? "",
                nhom_tinh_diem: values.nhom_tinh_diem ?? "",
                unit: values.unit ?? "",
                description: values.description ?? "",
                note: values.note ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
