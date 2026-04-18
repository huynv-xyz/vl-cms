import { useEffect, useMemo, useState } from "react"
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

import {
    updateShipment,
    getShipment,
} from "@/api/purchasing/shipment"
import { listContractItems } from "@/api/purchasing/contract-item"

import { shipmentSchema, shipmentUiSchema } from "./shipment-form-schema"
import { ShipmentItemsEditor } from "./shipment-items-editor"

import type {
    ShipmentFormItem,
    ShipmentHeaderFormValues,
} from "./types"
import { Shipment } from "../data/schema"

type Props = {
    shipment: Shipment
    open: boolean
    onOpenChange: (open: boolean) => void
}

const defaultHeader: ShipmentHeaderFormValues = {
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
}

export function UpdateShipmentDialog({
    shipment,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ["shipment-detail", shipment?.id],
        queryFn: () => getShipment(shipment.id),
        enabled: open && !!shipment?.id,
    })

    const detail = data?.data ?? data

    const { data: contractItemsData } = useQuery({
        queryKey: ["contract-items-for-shipment", shipment.contract_id],
        queryFn: () =>
            listContractItems({
                page: 1,
                size: 1000,
                contract_id: shipment.contract_id,
            }),
        enabled: open && !!shipment.contract_id,
    })

    const rawContractItems = contractItemsData?.items ?? []

    const mappedContractItems: ShipmentFormItem[] = useMemo(
        () =>
            rawContractItems.map((item: any) => ({
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
        [rawContractItems]
    )

    const [headerFormData, setHeaderFormData] =
        useState<ShipmentHeaderFormValues>(defaultHeader)

    const [items, setItems] = useState<ShipmentFormItem[]>([])

    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            ...defaultHeader,
            ...detail,
        })

        const detailItems = detail.items ?? []

        const map = new Map<number, ShipmentFormItem>()

        mappedContractItems.forEach((i) => {
            if (i.product_id != null) {
                map.set(i.product_id, i)
            }
        })

        // 2. override bằng shipment items
        detailItems.forEach((i: any) => {
            map.set(i.product_id, {
                id: i.id,
                product_id: i.product_id,
                product: i.product,
                selected: true,
                quantity: i.quantity ?? 0,
                defect_quantity: i.defect_quantity ?? 0,
                unit_price: i.unit_price ?? 0,
                packaging_price: i.packaging_price ?? 0,
                freight_price: i.freight_price ?? 0,
                note: i.note ?? "",
            } as any)
        })

        setItems(Array.from(map.values()))
    }, [open, detail, mappedContractItems])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const selectedItems: any = items.filter((x) => x.selected)

            return updateShipment({
                id: shipment.id,
                contract_id: shipment.contract_id,

                ...headerFormData,
                destination_port_id: headerFormData.destination_port_id
                    ? Number(headerFormData.destination_port_id)
                    : undefined,

                items: selectedItems.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity ?? 0,
                    defect_quantity: item.defect_quantity ?? 0,
                    unit_price: item.unit_price ?? 0,
                    packaging_price: item.packaging_price ?? 0,
                    freight_price: item.freight_price ?? 0,
                    note: item.note ?? "",
                } as any)),
            } as any)
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["shipments", shipment.contract_id],
            })
            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Cập nhật lô hàng</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-4 text-sm">Đang tải dữ liệu...</div>
                ) : (
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
                            <ShipmentItemsEditor
                                items={items}
                                onChange={setItems}
                            />

                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={isPending}
                            >
                                {isPending ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </Form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}