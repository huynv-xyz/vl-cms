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
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
    })
    const [keyword, setKeyword] = useState("")

    const page = pagination.pageIndex + 1
    const size = pagination.pageSize

    const { data, isLoading, error } = usePaginatedList(
        ["payments", contract.id, page, size, keyword],
        listPayments,
        {
            page,
            size,
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
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
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