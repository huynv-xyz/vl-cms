import { updateNation, type UpdateNationRequest } from "@/api/purchasing/nation"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import type { Nation } from "../data/schema"
import { nationSchema, nationUiSchema } from "./nation-form-schema"
import type { NationFormValues } from "./types"

type Props = {
    nation: Nation
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateNationDialog({ nation, open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<NationFormValues, UpdateNationRequest, unknown>
            title="Cập nhật quốc gia"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={nationSchema}
            uiSchema={nationUiSchema}
            defaultValues={{
                code: nation.code ?? "",
                name: nation.name ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["nations"]}
            mutationFn={updateNation}
            mapFormToRequest={(values) => ({
                id: nation.id,
                code: values.code.trim().toUpperCase(),
                name: values.name.trim(),
            })}
        />
    )
}
