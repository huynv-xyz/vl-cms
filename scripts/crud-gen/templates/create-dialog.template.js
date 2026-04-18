export function createDialogTemplate({ Entity }) {
    return `
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { create${Entity} } from "@/api/${Entity.toLowerCase()}"
import { ${Entity.toLowerCase()}Schema, ${Entity.toLowerCase()}UiSchema } from "./${Entity.toLowerCase()}-form-schema"

export function Create${Entity}Dialog({ open, onOpenChange }) {
    return (
        <CrudFormDialog
            title="Create ${Entity}"
            open={open}
            onOpenChange={onOpenChange}
            schema={${Entity.toLowerCase()}Schema}
            uiSchema={${Entity.toLowerCase()}UiSchema}
            mutationFn={create${Entity}}
        />
    )
}
`
}