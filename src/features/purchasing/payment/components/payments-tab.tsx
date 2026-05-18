import { useState } from "react"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { PageSection } from "@/components/page-section"
import { listPayments } from "@/api/purchasing/payment"

import { PaymentsProvider } from "./payment-provider"
import { PaymentTable } from "./payment-table"
import { PaymentDialogs } from "./payment-dialogs"
import { CreatePaymentButton } from "./create-payment-button"

type Props = {
    contract: any
}

export function PaymentsTab({ contract }: Props) {
    const [keyword, setKeyword] = useState("")

    const { data, isLoading, error } = usePaginatedList(
        ["payments", contract.id, keyword],
        listPayments,
        {
            page: 1,
            size: 200,
            keyword,
            contract_id: contract.id,
        }
    )

    return (
        <PaymentsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Thanh toán"
                actions={<CreatePaymentButton />}
                data={data}
                className="p-0"
            >
                {(data) => (
                    <div className="space-y-4">
                        <PaymentTable
                            data={data.items}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <PaymentDialogs contract={contract} />
                    </div>
                )}
            </PageSection>
        </PaymentsProvider>
    )
}
