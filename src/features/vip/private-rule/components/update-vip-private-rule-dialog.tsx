import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipPrivateRule,
    type UpdateVipPrivateRuleRequest,
} from "@/api/vip-private-rule"

import type { VipPrivateRule } from "../data/schema"
import {
    vipPrivateRuleSchema,
    vipPrivateRuleUiSchema,
} from "./vip-private-rule-form-schema"
import type { VipPrivateRuleFormValues } from "./types"

type Props = {
    rule: VipPrivateRule
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipPrivateRuleDialog({
    rule,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipPrivateRuleFormValues, UpdateVipPrivateRuleRequest, unknown>
            title="Chỉnh sửa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipPrivateRuleSchema}
            uiSchema={vipPrivateRuleUiSchema}
            defaultValues={{
                code: rule.code,
                name: rule.name,
                amount: rule.amount ?? 0,
                unit: rule.unit ?? "",
                note: rule.note ?? "",
                status: rule.status === 1,
            }}
            submitText="Lưu"
            queryKeyToInvalidate={["vip-private-rule"]}
            mutationFn={updateVipPrivateRule}
            mapFormToRequest={(values) => ({
                id: rule.id,
                code: values.code,
                name: values.name,
                amount: values.amount ?? 0,
                unit: values.unit ?? "",
                note: values.note?.trim() ? values.note.trim() : null,
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
