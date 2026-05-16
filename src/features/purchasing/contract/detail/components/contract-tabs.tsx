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
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-md bg-muted p-1.5">
                <TabsTrigger value="items" className="gap-2 rounded-sm py-3 text-base font-semibold">
                    <Boxes className="h-5 w-5" />
                    Hàng hóa
                </TabsTrigger>
                <TabsTrigger value="shipments" className="gap-2 rounded-sm py-3 text-base font-semibold">
                    <PackageCheck className="h-5 w-5" />
                    Lô hàng
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2 rounded-sm py-3 text-base font-semibold">
                    <CreditCard className="h-5 w-5" />
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
