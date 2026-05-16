import { createNation, type CreateNationRequest } from "@/api/purchasing/nation"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { nationSchema, nationUiSchema } from "./nation-form-schema"
import type { NationFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateNationDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<NationFormValues, CreateNationRequest, unknown>
            title="Tạo quốc gia"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={nationSchema}
            uiSchema={nationUiSchema}
            defaultValues={{
                code: "",
                name: "",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["nations"]}
            mutationFn={createNation}
            mapFormToRequest={(values) => ({
                code: values.code.trim().toUpperCase(),
                name: values.name.trim(),
            })}
        />
    )
}
