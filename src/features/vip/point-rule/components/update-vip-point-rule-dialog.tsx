import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipPointRule,
    type UpdateVipPointRuleRequest,
} from "@/api/vip-point-rule"

import type { VipPointRule } from "../data/schema"
import { vipPointRuleSchema, vipPointRuleUiSchema } from "./vip-point-rule-form-schema"
import type { VipPointRuleFormValues } from "./types"

type Props = {
    rule: VipPointRule
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipPointRuleDialog({
    rule,
    open,
    onOpenChange
}: Props) {
    return (
        <CrudFormDialog<VipPointRuleFormValues, UpdateVipPointRuleRequest, unknown>
            title="Cập nhật VIP Point Rule"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipPointRuleSchema}
            uiSchema={vipPointRuleUiSchema}
            defaultValues={{
                vthh_con: rule.vthh_con,
                from_value: rule.from_value ?? 0,
                to_value: rule.to_value ?? 0,
                he_so_mb: rule.he_so_mb ?? 0,
                he_so_mn: rule.he_so_mn ?? 0,
                group_code: rule.group_code ?? "",
                unit: rule.unit ?? "",
                description: rule.description ?? "",
                note: rule.note ?? "",
                status: rule.status === 1,
            }}
            submitText="Cập nhật VIP Point Rule"
            loadingText="Đang cập nhật..."
            queryKeyToInvalidate={["vip-point-rule"]}
            mutationFn={updateVipPointRule}
            mapFormToRequest={(values) => ({
                id: rule.id,
                vthh_con: values.vthh_con,
                from_value: values.from_value ?? 0,
                to_value: values.to_value ?? 0,
                he_so_mb: values.he_so_mb ?? 0,
                he_so_mn: values.he_so_mn ?? 0,
                group_code: values.group_code ?? "",
                unit: values.unit ?? "",
                description: values.description ?? "",
                note: values.note ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
