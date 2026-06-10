import { useQuery } from "@tanstack/react-query"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipPointRule,
    type UpdateVipPointRuleRequest,
} from "@/api/vip-point-rule"
import { listVipPointGroups } from "@/api/vip-point-group"

import type { VipPointRule } from "../data/schema"
import { buildVipPointRuleSchema, vipPointRuleUiSchema } from "./vip-point-rule-form-schema"
import { applySelectedPointGroup } from "./vip-point-rule-group-sync"
import type { VipPointRuleFormValues } from "./types"

type Props = {
    rule: VipPointRule
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipPointRuleDialog({
    rule,
    open,
    onOpenChange,
}: Props) {
    const { data: groupsData } = useQuery({
        queryKey: ["vip-point-group", "rule-selector"],
        queryFn: () => listVipPointGroups({
            page: 1,
            size: 1000,
            status: 1,
        }),
    })

    const groups = groupsData?.items ?? []
    const defaultValues = applySelectedPointGroup({
        vthh_con: rule.vthh_con,
        from_value: rule.from_value ?? 0,
        to_value: rule.to_value ?? 0,
        he_so_mb: rule.he_so_mb ?? 0,
        he_so_mn: rule.he_so_mn ?? 0,
        group_code: rule.group_code ?? "",
        nhom_tinh_diem: rule.nhom_tinh_diem ?? "",
        unit: rule.unit ?? "",
        description: rule.description ?? "",
        note: rule.note ?? "",
        status: rule.status === 1,
    }, groups)

    return (
        <CrudFormDialog<VipPointRuleFormValues, UpdateVipPointRuleRequest, unknown>
            title="Cập nhật VIP Point Rule"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={buildVipPointRuleSchema(groups)}
            uiSchema={vipPointRuleUiSchema}
            objectFieldClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
            defaultValues={defaultValues}
            submitText="Cập nhật VIP Point Rule"
            loadingText="Đang cập nhật..."
            successMessage="Cập nhật VIP Point Rule thành công"
            errorMessage="Cập nhật VIP Point Rule thất bại"
            queryKeyToInvalidate={["vip-point-rule"]}
            mutationFn={updateVipPointRule}
            onFormChange={(values) => applySelectedPointGroup(values, groups)}
            mapFormToRequest={(values) => ({
                id: rule.id,
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
