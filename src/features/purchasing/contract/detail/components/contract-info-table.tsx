
import { formatNumber } from "@/lib/utils"
import { Contract } from "../../data/schema"

type Props = {
    contract: Contract
}

export function ContractInfoTable({ contract }: Props) {
    return (
        <div className="rounded-2xl border bg-muted/30 p-6 shadow-sm space-y-6">

            {/* ================= KHỐI 1 ================= */}
            <div>
                <div className="text-xs font-semibold text-muted-foreground mb-3">
                    THÔNG TIN HỢP ĐỒNG
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <InfoCard>
                        <Row label="Mã HD" value={contract.code} />
                        <Row label="Nhà cung cấp" value={contract.supplier?.name} />
                        <Row label="Quốc gia" value={contract.supplier?.nation?.name} />
                    </InfoCard>

                    <InfoCard>
                        <Row label="Ngày ký" value={contract.signed_date} />
                        <Row label="Tỷ lệ cọc" value={`${contract.deposit_rate ?? 0}%`} />
                        <Row label="Thuế NK" value={`${contract.import_tax_rate ?? 0}%`} />
                        <Row label="VAT" value={`${contract.vat_rate ?? 0}%`} />
                    </InfoCard>

                    <InfoCard>
                        <Row label="Tiền tệ" value={contract.currency?.code} />
                        <Row label="Term (Loại giá)" value={contract.term} />
                        <Row label="Phương thức TT" value={contract.payment_method} />
                    </InfoCard>

                </div>
            </div>

            {/* ===== DIVIDER ===== */}
            <div className="border-t border-border/60" />

            <div>
                <div className="text-xs font-semibold text-muted-foreground mb-3">
                    TRẠNG THÁI & DÒNG TIỀN
                </div>

                <div className="rounded-xl border bg-background p-4">

                    {/* ===== LINE 1 ===== */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">

                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Tình trạng <b>hàng hóa</b>
                        </span>

                        <span>
                            Tổng số lượng:
                            <b className="ml-1">
                                {formatNumber(contract.total_quantity ?? 0)}
                            </b>
                        </span>

                        <span>
                            Số lượng đã giao:
                            <b className="ml-1">

                            </b>
                        </span>

                        <span>
                            Số lượng lỗi:
                            <b className="ml-1 text-red-500">
                                {formatNumber(contract.total_defect_quantity ?? 0)}
                            </b>
                        </span>
                    </div>

                    {/* divider */}
                    <div className="border-t my-3" />

                    {/* ===== LINE 2 ===== */}
                    <div className="flex flex-wrap items-center gap-3 text-lg font-semibold">

                        <span>
                            💰 Tổng giá trị:
                            <b className="ml-1">
                                {formatNumber(contract.total_amount ?? 0)}
                            </b>
                        </span>

                        <span className="text-muted-foreground">|</span>

                        <span className="text-green-600">
                            ✅ Đã TT:
                            <b className="ml-1">
                                {formatNumber(contract.total_paid_amount ?? 0)}
                            </b>
                        </span>

                        <span className="text-muted-foreground">|</span>

                        <span className="text-orange-500">
                            ⚠️ Còn lại:
                            <b className="ml-1">
                                {formatNumber(contract.remaining_amount ?? 0)}
                            </b>
                        </span>

                        <span className="text-muted-foreground">|</span>

                        <span>
                            Tỷ lệ:
                            <b className="ml-1">
                                {calcPercent(
                                    contract.total_paid_amount,
                                    contract.total_amount
                                )}%
                            </b>
                        </span>

                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-background p-3 space-y-1 text-sm">
            {children}
        </div>
    )
}

function Row({
    label,
    value,
}: {
    label: string
    value?: any
}) {
    return (
        <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium text-right">{value ?? "-"}</span>
        </div>
    )
}

function calcPercent(paid?: number, total?: number) {
    if (!paid || !total) return 0
    return Math.round((paid / total) * 100)
}