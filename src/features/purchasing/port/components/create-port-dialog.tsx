import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { portSchema, portUiSchema } from "./port-form-schema"
import type { PortFormValues } from "./types"
import { createPort, CreatePortRequest } from "@/api/purchasing/port"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreatePortDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<PortFormValues, CreatePortRequest, unknown>
            title="Tạo cảng"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={portSchema}
            uiSchema={portUiSchema}
            defaultValues={{
                name: "",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["ports"]}
            mutationFn={createPort}
            mapFormToRequest={(v) => ({
                ...v,
                name: v.name.trim(),
            })}
        />
    )
}