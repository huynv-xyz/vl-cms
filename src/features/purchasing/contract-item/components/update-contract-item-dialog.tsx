import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateContractItem,
    type UpdateContractItemRequest,
} from "@/api/purchasing/contract-item"
import {
    contractItemSchema,
    buildContractItemUiSchema,
} from "./contract-item-form-schema"
import type { ContractItemFormValues } from "./types"
import { ContractItem } from "../data/schema"

type Props = {
    item: ContractItem
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateContractItemDialog({
    item,
    open,
    onOpenChange,
}: Props) {
    if (!item) return null

    return (
        <CrudFormDialog<ContractItemFormValues, UpdateContractItemRequest, unknown>
            key={item.id}
            title="Cập nhật hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={contractItemSchema}
            uiSchema={buildContractItemUiSchema(
                item.product
                    ? {
                        value: item.product_id,
                        label: `${item.product.code} - ${item.product.name}`,
                    }
                    : undefined
            )}
            dialogClassName="max-h-[86vh] !w-[calc(100vw-32px)] !max-w-[760px]"

            defaultValues={{
                product_id: item.product_id,
                quantity: item.quantity ?? 0,
                unit_price: item.unit_price ?? 0,
                discount_amount: item.discount_amount ?? 0,
                packaging_price: item.packaging_price ?? 0,
                freight_price: item.freight_price ?? 0,
            }}

            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["contract-items", item.contract_id]}

            mutationFn={(data) =>
                updateContractItem({
                    ...data,
                    id: item.id,
                    contract_id: item.contract_id,
                })
            }

            // 🔥 FIX: ensure gửi đủ field
            mapFormToRequest={(v) => ({
                id: item.id,
                contract_id: item.contract_id,

                product_id: v.product_id,
                quantity: v.quantity,
                unit_price: v.unit_price,
                discount_amount: v.discount_amount,

                packaging_price: v.packaging_price ?? 0,
                freight_price: v.freight_price ?? 0,
            })}
        />
    )
}
