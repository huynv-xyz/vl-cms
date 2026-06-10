import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useVipPointGroups } from "./vip-point-groups-provider"

export function CreateVipPointGroupButton() {
    const { openCreate } = useVipPointGroups()

    return (
        <CrudCreateButton
            label="Tạo nhóm"
            onClick={openCreate}
        />
    )
}
