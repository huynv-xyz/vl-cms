import {
    updateGoodsDescription,
    type UpdateGoodsDescriptionRequest,
} from "@/api/sale/goods-description"
import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import type { GoodsDescription } from "../data/schema"
import { goodsDescriptionSchema, goodsDescriptionUiSchema } from "./goods-description-form-schema"
import type { GoodsDescriptionFormValues } from "./types"

type Props = {
    item: GoodsDescription
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateGoodsDescriptionDialog({ item, open, onOpenChange }: Props) {
    return (
        <CrudFormDialog<GoodsDescriptionFormValues, UpdateGoodsDescriptionRequest, unknown>
            title="Cập nhật mô tả HH"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={goodsDescriptionSchema}
            uiSchema={goodsDescriptionUiSchema}
            defaultValues={{
                name: item.name ?? "",
                note: item.note ?? "",
                active: item.active ?? 1,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["goods-descriptions"]}
            mutationFn={updateGoodsDescription}
            mapFormToRequest={(values) => ({
                id: item.id,
                name: values.name.trim(),
                note: values.note?.trim(),
                active: values.active,
            })}
        />
    )
}
