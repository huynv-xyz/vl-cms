import type { CustomerVipDetailItem } from "@/features/vip/customer/data/schema"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
    items: CustomerVipDetailItem[]
}

function formatNumber(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return "-"
    const num = typeof value === "string" ? Number(value) : value
    if (Number.isNaN(num)) return String(value)
    return new Intl.NumberFormat("vi-VN").format(num)
}

export function CustomerVipDetailTable({ items }: Props) {
    return (
        <Card className="overflow-hidden rounded-xl border shadow-sm">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1500px]">
                        <TableHeader>
                            <TableRow className="bg-[#5f8ec6] hover:bg-[#5f8ec6]">
                                <TableHead className="w-[70px] text-center font-bold text-white">
                                    STT
                                </TableHead>
                                <TableHead className="font-bold text-white">Mã chung</TableHead>
                                <TableHead className="font-bold text-white">
                                    Nhóm hàng hóa
                                </TableHead>
                                <TableHead className="font-bold text-white">ĐVT</TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL đặt
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL dự kiến
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    Hệ số
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL cần thêm (KK)
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL cần thêm (MT)
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL admin nhập
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    Điểm đạt admin
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    Điểm đạt
                                </TableHead>
                                <TableHead className="font-bold text-white">Ưu tiên</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={13}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Không có dữ liệu chi tiết
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, index) => (
                                    <TableRow
                                        key={`${item.stt}-${item.group_code}-${index}`}
                                        className="odd:bg-[#dfe8f5] even:bg-white"
                                    >
                                        <TableCell className="text-center font-medium text-green-600">
                                            {item.stt}
                                        </TableCell>

                                        <TableCell className="font-medium">{item.group_code}</TableCell>

                                        <TableCell>{item.product_group}</TableCell>

                                        <TableCell>{item.unit}</TableCell>

                                        <TableCell className="text-right text-green-600">
                                            {formatNumber(item.achieved_qty)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.expected_qty)}
                                        </TableCell>

                                        <TableCell className="text-right text-green-600">
                                            {formatNumber(item.point_factor)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.needed_qty_recommended)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.needed_qty_target)}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold text-blue-700">
                                            {formatNumber(item.target_qty)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.target_point)}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold">
                                            {formatNumber(item.achieved_point)}
                                        </TableCell>

                                        <TableCell>{item.priority || "-"}</TableCell>
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
