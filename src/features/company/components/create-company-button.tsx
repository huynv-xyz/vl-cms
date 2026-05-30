import { CrudCreateButton } from "@/components/crud/crud-create-button"
import { useCompanies } from "./companies-provider"

export function CreateCompanyButton() {
    const { openCreate } = useCompanies()

    return (
        <CrudCreateButton label="Tạo mới" onClick={openCreate} />
    )
}
