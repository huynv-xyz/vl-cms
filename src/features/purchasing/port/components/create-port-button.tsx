
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { usePorts } from "./ports-provider"

export function CreatePortButton() {
    const { openCreate } = usePorts()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}
