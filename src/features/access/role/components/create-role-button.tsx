import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useAccessRoles } from "./roles-provider"

export function CreateRoleButton() {
    const { openCreate } = useAccessRoles()
    return <CrudCreateButton label="Tạo vai trò" onClick={openCreate} />
}
