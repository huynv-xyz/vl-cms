import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updatePermission,
    type UpdatePermissionRequest,
} from "@/api/auth/permission"
import type { PermissionRow } from "../data/schema"
import {
    permissionSchema,
    permissionUiSchema,
} from "./permission-form-schema"
import type { PermissionFormValues } from "./types"

type Props = {
    permission: PermissionRow
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdatePermissionDialog({
    permission,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<PermissionFormValues, UpdatePermissionRequest, unknown>
            title="Cập nhật quyền"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={permissionSchema}
            uiSchema={permissionUiSchema}
            defaultValues={{
                module: permission.module,
                action: permission.action,
                name: permission.name ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["admin", "permissions"]}
            mutationFn={updatePermission}
            mapFormToRequest={(values) => ({
                id: permission.id,
                module: values.module.trim(),
                action: values.action.trim(),
                name: values.name?.trim() ?? "",
            })}
        />
    )
}
