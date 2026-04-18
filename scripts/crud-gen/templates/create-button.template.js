export function createButtonTemplate({ Entity }) {
    return `
import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { use${Entity}s } from "./${Entity.toLowerCase()}s-provider"

export function Create${Entity}Button() {
    const { openCreate } = use${Entity}s()

    return (
        <CrudCreateButton label="Create ${Entity}" onClick={openCreate} />
    )
}
`
}