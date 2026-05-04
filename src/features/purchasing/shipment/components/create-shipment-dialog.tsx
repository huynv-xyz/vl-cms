import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
import { toast } from "sonner"
import { widgets } from "@/components/rjsf/widgets"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"

import { createShipment } from "@/api/purchasing/shipment"
import { listContractItems } from "@/api/purchasing/contract-item"

import { shipmentSchema, shipmentUiSchema } from "./shipment-form-schema"
import { ShipmentItemsEditor } from "./shipment-items-editor"

import type {
    ShipmentFormItem,
    ShipmentHeaderFormValues,
} from "./types"
import { Contract } from "../../contract/data/schema"

const EMPTY_ITEMS: any[] = []

type Props = {
    contractId: number
    contract: Contract
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateShipmentDialog({
    contractId,
    contract,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const { data, isLoading } = useQuery({
        queryKey: ["contract-items-for-shipment", contractId],
        queryFn: () =>
            listContractItems({
                page: 1,
                size: 1000,
                contract_id: contractId,
            }),
        enabled: open && !!contractId,
    })

    const rawItems = data?.items ?? EMPTY_ITEMS

    const mappedItems = useMemo<ShipmentFormItem[]>(
        () =>
            rawItems.map((item: any) => ({
                warehouse_id: item.warehouse_id,
                product_id: item.product_id,
                product: item.product,
                selected: false,
                quantity: 0,
                defect_quantity: 0,
                unit_price: item.unit_price ?? 0,
                packaging_price: 0,
                freight_price: 0,
                note: "",
            })),
        [rawItems]
    )

    // ========================
    // STATE
    // ========================
    const [headerFormData, setHeaderFormData] =
        useState<ShipmentHeaderFormValues>({
            code: "",
            etd: "",
            eta: "",
            ata: "",
            warehouse_at: "",
            container_no: "",
            destination_port_id: undefined,
            exchange_rate: 1,
            status: "PLANNED",
            note: "",
        })

    const [items, setItems] = useState<ShipmentFormItem[]>([])

    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            return
        }

        setHeaderFormData({
            code: "",
            etd: "",
            eta: "",
            ata: "",
            warehouse_at: "",
            container_no: "",
            destination_port_id: undefined,
            exchange_rate: contract?.currency?.exchange_rate ?? 1, // ✅ FIX
            status: "PLANNED",
            note: "",
        })
    }, [open, contract])

    useEffect(() => {
        if (!open || initializedRef.current || isLoading) return

        setItems(mappedItems)
        initializedRef.current = true
    }, [open, isLoading, mappedItems])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const selectedItems = items.filter((x) => x.selected)

            if (!selectedItems.length) {
                throw new Error("Vui lòng chọn ít nhất 1 hàng hóa.")
            }

            for (const item of selectedItems) {
                if ((item.quantity ?? 0) <= 0) {
                    throw new Error(
                        `Số lượng phải > 0 (${item.product?.code})`
                    )
                }
            }

            return createShipment({
                contract_id: contractId,

                code: headerFormData.code,
                etd: headerFormData.etd,
                eta: headerFormData.eta,

                exchange_rate: headerFormData.exchange_rate ?? 1,
                status: headerFormData.status,
                note: headerFormData.note,

                items: selectedItems.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity ?? 0,
                    unit_price: item.unit_price ?? 0,
                    packaging_price: item.packaging_price ?? 0,
                    freight_price: item.freight_price ?? 0,
                    note: item.note ?? "",
                })),
            } as any)
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["shipments", contractId],
            })
            toast.success("Tạo lô hàng thành công")
            onOpenChange(false)
        },

        onError: (error: unknown) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Tạo lô hàng thất bại"
            )
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Tạo lô hàng</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <Form
                        validator={rjsfValidator}
                        schema={shipmentSchema}
                        uiSchema={shipmentUiSchema}
                        formData={headerFormData}
                        widgets={widgets}
                        templates={{
                            FieldTemplate: ShadcnFieldTemplate,
                        }}
                        onChange={({ formData }) =>
                            setHeaderFormData(
                                formData as ShipmentHeaderFormValues
                            )
                        }
                        onSubmit={() => mutate()}
                    >
                        {isLoading ? (
                            <div>Đang tải hàng hóa...</div>
                        ) : (
                            <ShipmentItemsEditor
                                items={items}
                                onChange={setItems}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={isPending}
                        >
                            {isPending ? "Đang tạo..." : "Tạo"}
                        </Button>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}