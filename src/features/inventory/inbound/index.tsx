import { InventoryLedgerReportPage } from "@/features/inventory/ledger"
import { Route } from "@/routes/_authenticated/inventory/inbounds"

export default function InventoryInboundPage() {
    return <InventoryLedgerReportPage route={Route} mode="in" />
}
