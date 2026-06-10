import { useQuery } from "@tanstack/react-query"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipPointRule,
    type CreateVipPointRuleRequest,
} from "@/api/vip-point-rule"
import { listVipPointGroups } from "@/api/vip-point-group"

import { buildVipPointRuleSchema, vipPointRuleUiSchema } from "./vip-point-rule-form-schema"
import { applySelectedPointGroup } from "./vip-point-rule-group-sync"
import type { VipPointRuleFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipPointRuleDialog({
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

    return (
        <CrudFormDialog<VipPointRuleFormValues, CreateVipPointRuleRequest, unknown>
            title="Tạo rule tính điểm"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={buildVipPointRuleSchema(groups)}
            uiSchema={vipPointRuleUiSchema}
            objectFieldClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
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
            onFormChange={(values) => applySelectedPointGroup(values, groups)}
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
