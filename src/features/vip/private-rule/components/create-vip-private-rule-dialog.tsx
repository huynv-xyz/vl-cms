import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipPrivateRule,
    type CreateVipPrivateRuleRequest,
} from "@/api/vip-private-rule"

import {
    vipPrivateRuleSchema,
    vipPrivateRuleUiSchema,
} from "./vip-private-rule-form-schema"
import type { VipPrivateRuleFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipPrivateRuleDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipPrivateRuleFormValues, CreateVipPrivateRuleRequest, unknown>
            title="Tạo mới"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipPrivateRuleSchema}
            uiSchema={vipPrivateRuleUiSchema}
            defaultValues={{
                code: "",
                name: "",
                amount: 0,
                note: "",
                status: true,
            }}
            queryKeyToInvalidate={["vip-private-rule"]}
            mutationFn={createVipPrivateRule}
            mapFormToRequest={(values) => ({
                code: values.code,
                name: values.name,
                amount: values.amount ?? 0,
                note: values.note?.trim() ? values.note.trim() : null,
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}