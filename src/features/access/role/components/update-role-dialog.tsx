import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateAccessRole,
    type UpdateAccessRoleRequest,
} from "@/api/auth/role"
import type { AccessRole } from "../data/schema"
import { roleSchema, roleUiSchema } from "./role-form-schema"
import type { RoleFormValues } from "./types"

type Props = {
    role: AccessRole
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateRoleDialog({ role, open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<RoleFormValues, UpdateAccessRoleRequest, unknown>
            title="Cập nhật vai trò"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={roleSchema}
            uiSchema={roleUiSchema}
            defaultValues={{
                code: role.code,
                name: role.name,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["admin", "access-roles"]}
            mutationFn={updateAccessRole}
            mapFormToRequest={(values) => ({
                id: role.id,
                code: values.code.trim(),
                name: values.name.trim(),
            })}
        />
    )
}
