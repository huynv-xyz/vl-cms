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
import { DialogLoadingState } from "@/components/loading-state"

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
    warehouse_id: undefined,
    container_no: "",
    destination_port_id: undefined,
    exchange_rate: 1,
    status: "IN_TRANSIT",
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

    const resolvedWarehouseId = detail?.warehouse_id ?? shipment?.warehouse_id
    const resolvedWarehouseOption = buildWarehouseOption(detail?.warehouse ?? shipment?.warehouse, resolvedWarehouseId)

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
                contract_item_id: item.id,
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
        [rawContractItems]
    )

    const [headerFormData, setHeaderFormData] =
        useState<ShipmentHeaderFormValues>(defaultHeader)

    const [items, setItems] = useState<ShipmentFormItem[]>([])

    const formUiSchema = useMemo(() => ({
        ...shipmentUiSchema,
        warehouse_id: {
            ...(shipmentUiSchema as any).warehouse_id,
            "ui:options": {
                ...((shipmentUiSchema as any).warehouse_id?.["ui:options"] || {}),
                initialOption: resolvedWarehouseOption,
            },
        },
    }), [resolvedWarehouseOption])

    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            code: detail.code ?? defaultHeader.code,
            etd: toDateInputValue(detail.etd),
            eta: toDateInputValue(detail.eta),
            ata: toDateInputValue(detail.ata),
            warehouse_at: toDateInputValue(detail.warehouse_at),
            warehouse_id: resolvedWarehouseId ?? defaultHeader.warehouse_id,
            container_no: detail.container_no ?? defaultHeader.container_no,
            destination_port_id: optionalPositiveNumber(detail.destination_port_id),
            exchange_rate: detail.exchange_rate ?? defaultHeader.exchange_rate,
            status: detail.status ?? defaultHeader.status,
            note: detail.note ?? defaultHeader.note,
        })

        const detailItems = detail.items ?? []

        const map = new Map<number, ShipmentFormItem>()

        mappedContractItems.forEach((i) => {
            if (i.contract_item_id != null) {
                map.set(i.contract_item_id, i)
            }
        })

        detailItems.forEach((i: any) => {
            const key = i.contract_item_id ?? findUniqueContractItemId(mappedContractItems, i.product_id)
            if (key == null) return

            map.set(key, {
                id: i.id,
                contract_item_id: key,
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
    }, [open, detail, mappedContractItems, resolvedWarehouseId])

    const { mutate, isPending } = useMutation({
        mutationFn: async (formValues?: ShipmentHeaderFormValues) => {
            const current = formValues ?? headerFormData

            const warehouseAt = current.warehouse_at || (
                current.status === "IN_WAREHOUSE" ? todayInputValue() : ""
            )
            if (current.status === "IN_WAREHOUSE" && !warehouseAt) {
                throw new Error("Chọn ngày về kho trước khi hoàn tất lô hàng")
            }

            const selectedItems: any = items.filter((x) => x.selected)
            const warehouseId = Number(current.warehouse_id)

            if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
                throw new Error("Chọn kho trước khi cập nhật lô hàng")
            }

            if (!selectedItems.length) {
                throw new Error("Vui lòng chọn ít nhất 1 hàng hóa.")
            }

            return updateShipment({
                id: shipment.id,
                contract_id: shipment.contract_id,
                ...current,
                warehouse_id: warehouseId,
                warehouse_at: warehouseAt || undefined,
                container_no: current.container_no,
                destination_port_id: current.destination_port_id
                    ? Number(current.destination_port_id)
                    : undefined,

                items: selectedItems.map((item: any) => ({
                    id: item.id,
                    contract_item_id: item.contract_item_id,
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
                queryKey: ["shipment-items"],
                refetchType: "active",
            })
            await queryClient.invalidateQueries({
                queryKey: ["shipment-detail", shipment.id],
            })
            await queryClient.invalidateQueries({ queryKey: ["contracts"], refetchType: "active" })
            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Cập nhật lô hàng thất bại")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] !w-[calc(100vw-32px)] !max-w-[820px] flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">Cập nhật lô hàng</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Cập nhật thông tin lô hàng và danh sách sản phẩm trong lô.
                    </p>
                </DialogHeader>

                {isLoading ? (
                    <div className="px-6 py-5">
                        <DialogLoadingState />
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        <Form
                            className="space-y-4"
                            validator={rjsfValidator}
                            schema={shipmentSchema}
                            uiSchema={formUiSchema}
                            formData={headerFormData}
                            widgets={widgets}
                            templates={{
                                FieldTemplate: ShadcnFieldTemplate,
                            }}
                            onChange={({ formData }) => {
                                const next = formData as ShipmentHeaderFormValues
                                if (next.status === "IN_WAREHOUSE" && !next.warehouse_at) {
                                    next.warehouse_at = todayInputValue()
                                }
                                setHeaderFormData(next)
                            }}
                            onSubmit={({ formData }) => mutate(formData as ShipmentHeaderFormValues)}
                        >
                            <div className="col-span-full">
                                <ShipmentItemsEditor
                                    items={items}
                                    onChange={setItems}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="col-span-full mt-2 w-full"
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

function toDateInputValue(value?: string) {
    if (!value) return ""

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value
    }

    const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`
    }

    return value
}

function todayInputValue() {
    return new Date().toISOString().slice(0, 10)
}

function optionalPositiveNumber(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined

    const numberValue = Number(value)
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined
}

function buildWarehouseOption(warehouse: any, warehouseId?: number) {
    if (!warehouseId || !warehouse) return undefined

    return {
        value: warehouseId,
        label: warehouse.name || warehouse.code || `Kho #${warehouseId}`,
    }
}

function findUniqueContractItemId(items: ShipmentFormItem[], productId?: number) {
    if (productId == null) return undefined

    const matches = items.filter((item) => item.product_id === productId && item.contract_item_id != null)
    return matches.length === 1 ? matches[0].contract_item_id : undefined
}
