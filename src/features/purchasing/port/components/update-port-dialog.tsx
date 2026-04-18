import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updatePort, type UpdatePortRequest } from "@/api/purchasing/port"
import type { Port } from "../data/schema"
import { portSchema, portUiSchema } from "./port-form-schema"
import type { PortFormValues } from "./types"

type Props = {
    port: Port
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdatePortDialog({
    port,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<PortFormValues, UpdatePortRequest, unknown>
            title="Cập nhật cảng"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={portSchema}
            uiSchema={portUiSchema}
            defaultValues={{
                name: port.name ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["ports"]}
            mutationFn={updatePort}
            mapFormToRequest={(v) => ({
                id: port.id,
                ...v,
                name: v.name.trim(),
            })}
        />
    )
}