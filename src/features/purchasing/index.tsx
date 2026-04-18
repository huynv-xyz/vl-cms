import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractInfo } from "./components/contract-info"
import { ContractItemsTable } from "./components/contract-items-table"
import { ShipmentsTable } from "./components/shipments-table"
import { PaymentsTable } from "./components/payments-table"
import { ContractDashboard } from "./components/contract-dashboard"

export function ContractDetailView() {
    return (
        <div className="p-6 space-y-6">

            <ContractInfo />

            <Tabs defaultValue="items">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="items">Hàng</TabsTrigger>
                    <TabsTrigger value="shipments">Lô hàng</TabsTrigger>
                    <TabsTrigger value="payments">Thanh toán</TabsTrigger>
                    <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
                </TabsList>

                <TabsContent value="items">
                    <ContractItemsTable />
                </TabsContent>

                <TabsContent value="shipments">
                    <ShipmentsTable />
                </TabsContent>

                <TabsContent value="payments">
                    <PaymentsTable />
                </TabsContent>

                <TabsContent value="dashboard">
                    <ContractDashboard />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ContractDetailView