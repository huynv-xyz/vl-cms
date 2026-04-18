import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createContractItem,
    type CreateContractItemRequest,
} from "@/api/purchasing/contract-item"
import {
    contractItemSchema,
    buildContractItemUiSchema,
} from "./contract-item-form-schema"
import type { ContractItemFormValues } from "./types"

type Props = {
    contractId: number
    open: boolean
    onOpenChange: (open: boolean) => void
}
export function CreateContractItemDialog({
    contractId,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<ContractItemFormValues, CreateContractItemRequest, unknown>
            title="Thêm hàng hóa"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={contractItemSchema}
            uiSchema={buildContractItemUiSchema()}

            defaultValues={{
                product_id: undefined,
                quantity: 0,
                unit_price: 0,
                discount_amount: 0,
                packaging_price: 0,
                freight_price: 0,
            }}

            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["contract-items", contractId]}

            mutationFn={(data) =>
                createContractItem({
                    ...data,
                    contract_id: contractId,
                })
            }

            // 🔥 FIX: explicit mapping
            mapFormToRequest={(v) => ({
                contract_id: contractId,

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