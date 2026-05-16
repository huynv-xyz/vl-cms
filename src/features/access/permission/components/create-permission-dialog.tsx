import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createPermission,
    type CreatePermissionRequest,
} from "@/api/auth/permission"
import {
    permissionSchema,
    permissionUiSchema,
} from "./permission-form-schema"
import type { PermissionFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreatePermissionDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<PermissionFormValues, CreatePermissionRequest, unknown>
            title="Tạo quyền"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={permissionSchema}
            uiSchema={permissionUiSchema}
            defaultValues={{ module: "", action: "", name: "" }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["admin", "permissions"]}
            mutationFn={createPermission}
            mapFormToRequest={(values) => ({
                module: values.module.trim(),
                action: values.action.trim(),
                name: values.name?.trim() ?? "",
            })}
        />
    )
}
