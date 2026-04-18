import { formatNumber } from "@/lib/utils"
import { Contract } from "../../data/schema"

type Props = {
    contract: Contract
}

export function ContractInfoTable({ contract }: Props) {
    const items = [
        {
            label: "Mã hợp đồng",
            value: contract.code,
        },
        {
            label: "Nhà cung cấp",
            value: contract.supplier?.name,
        },
        {
            label: "Quốc gia",
            value: contract.supplier?.nation?.name,
        },
        {
            label: "Tiền tệ",
            value: contract.currency?.code,
        },

        // ===== FINANCE =====
        {
            label: "Tỷ lệ cọc",
            value: `${contract.deposit_rate ?? 0}%`,
        },
        {
            label: "Thuế nhập khẩu",
            value: (
                <span className="text-orange-500">
                    {contract.import_tax_rate ?? 0}%
                </span>
            ),
        },
        {
            label: "Thuế VAT",
            value: (
                <span className="text-blue-500">
                    {contract.vat_rate ?? 0}%
                </span>
            ),
        },

        // ===== PLAN =====
        {
            label: "Tổng số lượng",
            value: formatNumber(contract.total_quantity ?? 0),
        },

        // ===== DEFECT =====
        {
            label: "Số lượng lỗi",
            value: (
                <span className="text-red-500">
                    {formatNumber(contract.total_defect_quantity ?? 0)}
                </span>
            ),
        },

        // ===== REAL =====
        {
            label: "Số lượng thực",
            value: (
                <span className="text-green-600">
                    {formatNumber(contract.real_quantity ?? 0)}
                </span>
            ),
        },

        {
            label: "Tổng giá trị hàng",
            value: formatNumber(contract.total_amount ?? 0),
        },

        {
            label: "Giá trị thực",
            value: (
                <span className="text-green-600">
                    {formatNumber(contract.real_amount ?? 0)}
                </span>
            ),
        },

        // ===== PAYMENT =====
        {
            label: "Đã thanh toán",
            value: (
                <span className="text-blue-600">
                    {formatNumber(contract.total_paid_amount ?? 0)}
                </span>
            ),
        },
        {
            label: "Còn lại",
            value: (
                <span className="text-orange-500">
                    {formatNumber(contract.remaining_amount ?? 0)}
                </span>
            ),
        },
    ]

    return (
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-6">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="border-b border-border/60 pb-4"
                    >
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {item.label}
                        </div>
                        <div className="mt-2 break-words text-lg font-semibold text-foreground">
                            {item.value ?? "-"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}