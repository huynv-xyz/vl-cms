import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createRegion, type CreateRegionRequest } from "@/api/region"
import { regionSchema, regionUiSchema } from "./region-form-schema"
import type { RegionFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateRegionDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<RegionFormValues, CreateRegionRequest, unknown>
            title="Tạo khu vực"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={regionSchema}
            uiSchema={regionUiSchema}
            defaultValues={{
                code: "",
                name: "",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["region"]}
            mutationFn={createRegion}
            mapFormToRequest={(values) => ({
                code: values.code?.trim() ?? "",
                name: values.name?.trim() ?? "",
            })}
        />
    )
}