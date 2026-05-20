import {
    createGoodsDescription,
    type CreateGoodsDescriptionRequest,
} from "@/api/sale/goods-description"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { goodsDescriptionSchema, goodsDescriptionUiSchema } from "./goods-description-form-schema"
import type { GoodsDescriptionFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateGoodsDescriptionDialog({ open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<GoodsDescriptionFormValues, CreateGoodsDescriptionRequest, unknown>
            title="Tạo mô tả HH"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={goodsDescriptionSchema}
            uiSchema={goodsDescriptionUiSchema}
            defaultValues={{
                name: "",
                note: "",
                active: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["goods-descriptions"]}
            mutationFn={createGoodsDescription}
            mapFormToRequest={(values) => ({
                name: values.name.trim(),
                note: values.note?.trim(),
                active: values.active,
            })}
        />
    )
}
