import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipPointGroup,
    type CreateVipPointGroupRequest,
} from "@/api/vip-point-group"

import { vipPointGroupSchema, vipPointGroupUiSchema } from "./vip-point-group-form-schema"
import type { VipPointGroupFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipPointGroupDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipPointGroupFormValues, CreateVipPointGroupRequest, unknown>
            title="Tạo nhóm tính điểm"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipPointGroupSchema}
            uiSchema={vipPointGroupUiSchema}
            objectFieldClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
            defaultValues={{
                group_code: "",
                group_name: "",
                unit: "",
                he_so_mb: 0,
                he_so_mn: 0,
                description: "",
                status: true,
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            successMessage="Tạo nhóm tính điểm thành công"
            errorMessage="Tạo nhóm tính điểm thất bại"
            queryKeyToInvalidate={["vip-point-group"]}
            mutationFn={createVipPointGroup}
            mapFormToRequest={(values) => ({
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
