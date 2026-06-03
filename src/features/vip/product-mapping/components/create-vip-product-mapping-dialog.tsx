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
                product_code: "",
                customer_code: "",
                he_so_mb: 0,
                he_so_mn: 0,
                note: "",
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            successMessage="Tạo quy tắc điểm hàng hóa thành công"
            errorMessage="Tạo quy tắc điểm hàng hóa thất bại"
            queryKeyToInvalidate={["vip-product-mapping"]}
            mutationFn={createVipProductMapping}
            mapFormToRequest={(values) => ({
                product_code: values.product_code,
                customer_code: values.customer_code ?? "",
                he_so_mb: values.he_so_mb ?? 0,
                he_so_mn: values.he_so_mn ?? 0,
                note: values.note ?? "",
            })}
        />
    )
}
