import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateVipProductMapping,
    type UpdateVipProductMappingRequest,
} from "@/api/vip-product-mapping"

import type { VipProductMapping } from "../data/schema"
import { vipProductMappingSchema, vipProductMappingUiSchema } from "./vip-product-mapping-form-schema"
import type { VipProductMappingFormValues } from "./types"

type Props = {
    mapping: VipProductMapping
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateVipProductMappingDialog({
    mapping,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipProductMappingFormValues, UpdateVipProductMappingRequest, unknown>
            title="Cập nhật quy tắc điểm hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipProductMappingSchema}
            uiSchema={vipProductMappingUiSchema}
            defaultValues={{
                product_group: mapping.product_group ?? "",
                ap_dung: mapping.ap_dung ?? "",
                he_so_hdn: mapping.he_so_hdn ?? 0,
                unit: mapping.unit ?? "",
                customer_code: mapping.customer_code ?? "",
                note: mapping.note ?? "",
            }}
            submitText="Lưu"
            loadingText="Đang cập nhật..."
            successMessage="Cập nhật quy tắc điểm hàng hóa thành công"
            errorMessage="Cập nhật quy tắc điểm hàng hóa thất bại"
            queryKeyToInvalidate={["vip-product-mapping"]}
            mutationFn={updateVipProductMapping}
            mapFormToRequest={(values) => ({
                id: mapping.id,
                product_group: values.product_group ?? "",
                ap_dung: values.ap_dung ?? "",
                he_so_hdn: values.he_so_hdn ?? 0,
                unit: values.unit ?? "",
                customer_code: values.customer_code ?? "",
                note: values.note ?? "",
            })}
        />
    )
}
