import { createFileRoute } from "@tanstack/react-router"

import PurchasingShipmentContractItemBackfillToolPage from "@/features/purchasing-shipment-contract-item-backfill-tool"

export const Route = createFileRoute("/_authenticated/tools/purchasing-shipment-contract-item-backfill/")({
    component: PurchasingShipmentContractItemBackfillToolPage,
})
