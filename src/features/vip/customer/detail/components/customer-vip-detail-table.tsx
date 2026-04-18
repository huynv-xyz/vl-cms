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
                                <TableHead className="font-bold text-white">MA_CHUNG</TableHead>
                                <TableHead className="font-bold text-white">
                                    NHÓM_HÀNG_HÓA
                                </TableHead>
                                <TableHead className="font-bold text-white">ĐVT</TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL_ĐẶT
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL_DỰ_KIẾN
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    HỆ_SỐ
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL cần thêm khuyến cáo
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL cần thêm mục tiêu
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    SL admin nhập
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    Điểm đạt admin
                                </TableHead>
                                <TableHead className="text-right font-bold text-white">
                                    Điểm_ĐẠT
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
                                        key={`${item.stt}-${item.ma_chung}-${index}`}
                                        className="odd:bg-[#dfe8f5] even:bg-white"
                                    >
                                        <TableCell className="text-center font-medium text-green-600">
                                            {item.stt}
                                        </TableCell>

                                        <TableCell className="font-medium">{item.ma_chung}</TableCell>

                                        <TableCell>{item.nhom_hang_hoa}</TableCell>

                                        <TableCell>{item.dvt}</TableCell>

                                        <TableCell className="text-right text-green-600">
                                            {formatNumber(item.sl_dat)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.sl_du_kien)}
                                        </TableCell>

                                        <TableCell className="text-right text-green-600">
                                            {formatNumber(item.he_so)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.sl_can_them_khuyen_cao)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.sl_can_them_muc_tieu)}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold text-blue-700">
                                            {formatNumber(item.sl_admin_nhap)}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {formatNumber(item.diem_dat_admin)}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold">
                                            {formatNumber(item.diem_dat)}
                                        </TableCell>

                                        <TableCell>{item.uu_tien || "-"}</TableCell>
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