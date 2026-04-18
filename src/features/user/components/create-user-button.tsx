import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useUsers } from "./users-provider"

export function CreateUserButton() {
    const { openCreate } = useUsers()

    return (
        <CrudCreateButton
            label="Tạo user"
            onClick={openCreate}
        />
    )
}