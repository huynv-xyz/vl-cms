import { Product } from "@/features/product/data/schema"
import { Shipment } from "../../shipment/data/schema"

export type ShipmentItem = {
    id: number
    shipment_id?: number
    shipment?: Shipment

    product_id?: number

    product?: Product

    quantity?: number
    unit_price?: number

    packaging_price?: number
    freight_price?: number
    defect_quantity?: number

    note?: string
}