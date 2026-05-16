import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useNations } from "./nations-provider"

export function CreateNationButton() {
    const { openCreate } = useNations()

    return <CrudCreateButton onClick={openCreate} />
}
