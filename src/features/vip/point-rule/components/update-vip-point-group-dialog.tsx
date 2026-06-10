import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipPointGroup,
    type UpdateVipPointGroupRequest,
} from "@/api/vip-point-group"

import type { VipPointGroup } from "../data/schema"
import { vipPointGroupSchema, vipPointGroupUiSchema } from "./vip-point-group-form-schema"
import type { VipPointGroupFormValues } from "./types"

type Props = {
    group: VipPointGroup
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipPointGroupDialog({
    group,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipPointGroupFormValues, UpdateVipPointGroupRequest, unknown>
            title="Cập nhật nhóm tính điểm"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipPointGroupSchema}
            uiSchema={vipPointGroupUiSchema}
            objectFieldClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
            defaultValues={{
                group_code: group.group_code,
                group_name: group.group_name ?? "",
                unit: group.unit ?? "",
                he_so_mb: group.he_so_mb ?? 0,
                he_so_mn: group.he_so_mn ?? 0,
                description: group.description ?? "",
                status: group.status === 1,
            }}
            submitText="Cập nhật"
            loadingText="Đang cập nhật..."
            successMessage="Cập nhật nhóm tính điểm thành công"
            errorMessage="Cập nhật nhóm tính điểm thất bại"
            queryKeyToInvalidate={["vip-point-group"]}
            mutationFn={updateVipPointGroup}
            mapFormToRequest={(values) => ({
                id: group.id,
                group_code: values.group_code,
                group_name: values.group_name ?? "",
                unit: values.unit ?? "",
                he_so_mb: values.he_so_mb ?? 0,
                he_so_mn: values.he_so_mn ?? 0,
                description: values.description ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}
