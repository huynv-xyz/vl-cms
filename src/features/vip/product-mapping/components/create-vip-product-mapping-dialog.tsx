import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createVipProductMapping,
    type CreateVipProductMappingRequest,
} from "@/api/vip-product-mapping"

import { vipProductMappingSchema, vipProductMappingUiSchema } from "./vip-product-mapping-form-schema"
import type { VipProductMappingFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVipProductMappingDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<VipProductMappingFormValues, CreateVipProductMappingRequest, unknown>
            title="Tạo mới quy tắc điểm hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={vipProductMappingSchema}
            uiSchema={vipProductMappingUiSchema}
            defaultValues={{
                product_group: "",
                ap_dung: "",
                he_so_hdn: 0,
                unit: "",
                customer_code: "",
                note: "",
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            successMessage="Tạo quy tắc điểm hàng hóa thành công"
            errorMessage="Tạo quy tắc điểm hàng hóa thất bại"
            queryKeyToInvalidate={["vip-product-mapping"]}
            mutationFn={createVipProductMapping}
            mapFormToRequest={(values) => ({
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
