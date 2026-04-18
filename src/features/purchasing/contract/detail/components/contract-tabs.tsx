import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractItemsTab } from "./contract-items-tab"
import { ShipmentsTab } from "./contract-shipments-tab"
import { PaymentsTab } from "../../../payment/components/payments-tab"
import { Contract } from "../../data/schema"

type Props = {
    contract: Contract
}

export function ContractTabs({ contract }: Props) {
    return (
        <Tabs defaultValue="items" className="w-full space-y-2 mt-6">
            <TabsList
                className="
            bg-muted/50
            p-1.5
            rounded-2xl
            shadow-sm
            inline-flex
        "
            >
                <TabsTrigger
                    value="items"
                    className="
                px-6 py-3 text-base font-semibold rounded-xl
                transition-all
                data-[state=active]:bg-background
                data-[state=active]:shadow-md
                data-[state=active]:text-foreground
            "
                >
                    Hàng hóa
                </TabsTrigger>

                <TabsTrigger
                    value="shipments"
                    className="
                px-6 py-3 text-base font-semibold rounded-xl
                transition-all
                data-[state=active]:bg-background
                data-[state=active]:shadow-md
                data-[state=active]:text-foreground
            "
                >
                    Lô hàng
                </TabsTrigger>

                <TabsTrigger
                    value="payments"
                    className="
                px-6 py-3 text-base font-semibold rounded-xl
                transition-all
                data-[state=active]:bg-background
                data-[state=active]:shadow-md
                data-[state=active]:text-foreground
            "
                >
                    Thanh toán
                </TabsTrigger>
            </TabsList>

            <TabsContent
                value="items"
                className=""
            >
                <ContractItemsTab contract={contract} />
            </TabsContent>

            <TabsContent
                value="shipments"
                className=""
            >
                <ShipmentsTab contract={contract} />
            </TabsContent>

            <TabsContent
                value="payments"
                className=""
            >
                <PaymentsTab contract={contract} />
            </TabsContent>
        </Tabs>
    )
}