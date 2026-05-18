import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Boxes, CreditCard, PackageCheck } from "lucide-react"
import type { Contract } from "../../data/schema"
import { PaymentsTab } from "../../../payment/components/payments-tab"
import { ContractItemsTab } from "./contract-items-tab"
import { ShipmentsTab } from "./contract-shipments-tab"

type Props = {
    contract: Contract
}

export function ContractTabs({ contract }: Props) {
    return (
        <Tabs defaultValue="items" className="w-full space-y-4">
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-md border border-slate-300 bg-[#f4f3ec] p-0.5">
                <TabsTrigger value="items" className="gap-2 rounded-sm border border-transparent py-2.5 text-sm font-semibold data-[state=active]:border-slate-300 data-[state=active]:bg-[#fbfaf2] data-[state=active]:shadow-none">
                    <Boxes className="h-4 w-4" />
                    Hàng hóa
                </TabsTrigger>
                <TabsTrigger value="shipments" className="gap-2 rounded-sm border border-transparent py-2.5 text-sm font-semibold data-[state=active]:border-slate-300 data-[state=active]:bg-[#fbfaf2] data-[state=active]:shadow-none">
                    <PackageCheck className="h-4 w-4" />
                    Lô hàng
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2 rounded-sm border border-transparent py-2.5 text-sm font-semibold data-[state=active]:border-slate-300 data-[state=active]:bg-[#fbfaf2] data-[state=active]:shadow-none">
                    <CreditCard className="h-4 w-4" />
                    Thanh toán
                </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-0">
                <ContractItemsTab contract={contract} />
            </TabsContent>

            <TabsContent value="shipments" className="mt-0">
                <ShipmentsTab contract={contract} />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
                <PaymentsTab contract={contract} />
            </TabsContent>
        </Tabs>
    )
}
