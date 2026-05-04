import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useReturns } from "./returns-provider"

export function CreateReturnButton() {
    const { openCreate } = useReturns()

    return (
        <CrudCreateButton onClick={openCreate} />
    )
}