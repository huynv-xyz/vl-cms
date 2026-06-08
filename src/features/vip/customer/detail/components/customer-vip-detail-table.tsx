import type { CustomerVipDetailItem } from "@/features/vip/customer/data/schema"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Props = {
    items: CustomerVipDetailItem[]
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
    CAO: "default",
    TRUNG_BINH: "secondary",
    THAP: "outline",
}

export function CustomerVipDetailTable({ items }: Props) {
    return (
        <Card className="overflow-hidden rounded-xl border shadow-sm">
            <CardHeader className="border-b px-5 py-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Chi tiết theo nhóm hàng hóa
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1400px] text-sm">
                        <TableHeader>
                            <TableRow className="bg-muted/60 hover:bg-muted/60">
                                <TableHead className="w-14 text-center font-semibold">STT</TableHead>
                                <TableHead className="font-semibold">Mã chung</TableHead>
                                <TableHead className="font-semibold">Nhóm hàng hóa</TableHead>
                                <TableHead className="font-semibold">ĐVT</TableHead>
                                <TableHead className="text-right font-semibold">SL đặt</TableHead>
                                <TableHead className="text-right font-semibold">SL dự kiến</TableHead>
                                <TableHead className="text-right font-semibold">Hệ số</TableHead>
                                <TableHead className="text-right font-semibold">Cần thêm (KK)</TableHead>
                                <TableHead className="text-right font-semibold">Cần thêm (MT)</TableHead>
                                <TableHead className="text-right font-semibold">SL dự kiến thêm</TableHead>
                                <TableHead className="text-right font-semibold">Điểm dự kiến</TableHead>
                                <TableHead className="text-right font-semibold">Điểm đạt</TableHead>
                                <TableHead className="text-center font-semibold">Ưu tiên</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                                        Không có dữ liệu chi tiết
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, index) => (
                                    <TableRow key={`${item.stt}-${item.group_code}-${index}`}>
                                        <TableCell className="text-center font-medium text-muted-foreground">
                                            {item.stt}
                                        </TableCell>

                                        <TableCell className="font-semibold">{item.group_code}</TableCell>

                                        <TableCell className="text-muted-foreground">{item.product_group || "—"}</TableCell>

                                        <TableCell>{item.unit || "—"}</TableCell>

                                        <TableCell className="text-right font-medium text-emerald-600">
                                            {formatNumber(Number(item.achieved_qty ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right text-muted-foreground">
                                            {formatNumber(Number(item.expected_qty ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right text-muted-foreground">
                                            {formatNumber(Number(item.point_factor ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(Number(item.needed_qty_recommended ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(Number(item.needed_qty_target ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold text-primary">
                                            {formatNumber(Number(item.planned_qty ?? item.target_qty ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right text-muted-foreground">
                                            {formatNumber(Number(item.projected_point ?? item.target_point ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold">
                                            {formatNumber(Number(item.achieved_point ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {item.priority ? (
                                                <Badge variant={PRIORITY_VARIANT[item.priority] ?? "outline"}>
                                                    {item.priority}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
