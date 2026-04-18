export function updateDialogTemplate({ Entity }) {
    return `
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { update${Entity} } from "@/api/${Entity.toLowerCase()}"

export function Update${Entity}Dialog({ ${Entity.toLowerCase()}, open, onOpenChange }) {
    return (
        <CrudFormDialog
            title="Update ${Entity}"
            open={open}
            onOpenChange={onOpenChange}
            mutationFn={update${Entity}}
        />
    )
}
`
}