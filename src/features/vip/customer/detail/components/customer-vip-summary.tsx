import type { CustomerVipDetail } from "@/features/vip/customer/data/schema"
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type Props = {
    data: CustomerVipDetail
}

function formatNumber(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return "-"
    const num = typeof value === "string" ? Number(value) : value
    if (Number.isNaN(num)) return String(value)
    return new Intl.NumberFormat("vi-VN").format(num)
}

function LabelCell({ children }: { children: React.ReactNode }) {
    return (
        <TableCell className="whitespace-nowrap text-muted-foreground font-medium">
            {children}
        </TableCell>
    )
}

function ValueCell({
    children,
    alignRight,
    highlight,
}: {
    children: React.ReactNode
    alignRight?: boolean
    highlight?: boolean
}) {
    return (
        <TableCell
            className={`font-medium ${alignRight ? "text-right" : ""
                } ${highlight ? "font-semibold" : ""}`}
        >
            {children}
        </TableCell>
    )
}

export function CustomerVipSummary({ data }: Props) {
    return (
        <Card className="rounded-xl border">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1200px]">
                        <TableBody>
                            {/* Row 1 */}
                            <TableRow>
                                <LabelCell>Mã khách hàng</LabelCell>
                                <ValueCell>{data.customer_code}</ValueCell>

                                <LabelCell>Nhóm</LabelCell>
                                <ValueCell>{data.group_code || "-"}</ValueCell>

                                <LabelCell>Bậc hiện tại</LabelCell>
                                <ValueCell>{data.tier_name || "-"}</ValueCell>

                                <LabelCell>Điểm hiện tại</LabelCell>
                                <ValueCell alignRight highlight>
                                    {formatNumber(data.total_vip_point)}
                                </ValueCell>

                                <LabelCell>Bậc kế tiếp</LabelCell>
                                <ValueCell>{data.next_tier_name || "-"}</ValueCell>

                                <LabelCell>Thưởng cuối</LabelCell>
                                <ValueCell alignRight>
                                    {formatCurrency(Number(data.final_bonus_amount ?? 0))}
                                </ValueCell>
                            </TableRow>

                            {/* Row 2 */}
                            <TableRow>
                                <LabelCell>Tên khách hàng</LabelCell>
                                <ValueCell>{data.customer_name}</ValueCell>

                                <LabelCell>Khu vực</LabelCell>
                                <ValueCell>{data.region || "-"}</ValueCell>

                                <LabelCell>Loại KH</LabelCell>
                                <ValueCell>{data.customer_type || "-"}</ValueCell>

                                <LabelCell>Điểm còn thiếu</LabelCell>
                                <ValueCell alignRight highlight>
                                    {formatNumber(data.missing_point_to_next)}
                                </ValueCell>

                                <LabelCell>Thông báo</LabelCell>
                                <ValueCell>
                                    {data.missing_point_message || "-"}
                                </ValueCell>

                                <LabelCell>Năm</LabelCell>
                                <ValueCell>{data.calc_year}</ValueCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
