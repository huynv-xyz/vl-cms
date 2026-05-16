import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useAccessPermissions } from "./permissions-provider"

export function CreatePermissionButton() {
    const { openCreate } = useAccessPermissions()
    return <CrudCreateButton label="Tạo quyền" onClick={openCreate} />
}
