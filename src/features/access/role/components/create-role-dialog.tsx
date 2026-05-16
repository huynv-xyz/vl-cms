import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createAccessRole,
    type CreateAccessRoleRequest,
} from "@/api/auth/role"
import { roleSchema, roleUiSchema } from "./role-form-schema"
import type { RoleFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<RoleFormValues, CreateAccessRoleRequest, unknown>
            title="Tạo vai trò"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={roleSchema}
            uiSchema={roleUiSchema}
            defaultValues={{ code: "", name: "" }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["admin", "access-roles"]}
            mutationFn={createAccessRole}
            mapFormToRequest={(values) => ({
                code: values.code.trim(),
                name: values.name.trim(),
            })}
        />
    )
}
