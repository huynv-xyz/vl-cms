import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateRegion, type UpdateRegionRequest } from "@/api/region"
import type { Region } from "../data/schema"
import { regionSchema, regionUiSchema } from "./region-form-schema"
import type { RegionFormValues } from "./types"

type Props = {
    region: Region
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateRegionDialog({
    region,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<RegionFormValues, UpdateRegionRequest, unknown>
            title="Cập nhật khu vực"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={regionSchema}
            uiSchema={regionUiSchema}
            defaultValues={{
                code: region.code ?? "",
                name: region.name ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["region"]}
            mutationFn={updateRegion}
            mapFormToRequest={(values) => ({
                id: region.id,
                code: values.code?.trim() ?? "",
                name: values.name?.trim() ?? "",
                status: 1,
            })}
        />
    )
}