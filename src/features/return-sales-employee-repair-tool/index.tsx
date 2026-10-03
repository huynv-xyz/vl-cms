import { useState } from "react"
import { toast } from "sonner"
import { DatabaseZap, Search } from "lucide-react"

import {
    applyReturnSalesEmployeeRepair,
    checkReturnSalesEmployeeRepair,
    loadUnresolvedReturnSalesEmployees,
    type ReturnSalesEmployeeRepairResult,
    type ReturnSalesEmployeeRepairRow,
} from "@/api/return-sales-employee-repair-tool"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sourceLabel: Record<string, string> = {
    TRANSACTION_CODE: "Mã đã có trên giao dịch",
    RETURN_TRANSACTION_CODE: "Mã đã có trên cùng phiếu trả",
    RETURN: "Nhân viên trên phiếu trả",
    CUSTOMER_CURRENT: "Nhân viên hiện tại của khách hàng",
    ORDER: "Nhân viên của đơn hàng",
}

const reasonLabel: Record<string, string> = {
    EMPLOYEE_INCOMPLETE: "Nhân viên trong danh mục thiếu mã hoặc tên",
    UNKNOWN_TRANSACTION_CODE: "Mã nhân viên trên giao dịch không còn trong danh mục",
    INVALID_RETURN_EMPLOYEE: "Nhân viên đã lưu trên phiếu trả không hợp lệ",
    CONFLICTING_TRANSACTION_CODES: "Các dòng cùng phiếu có mã nhân viên khác nhau hoặc mã không hợp lệ",
    MISSING_CUSTOMER: "Phiếu trả không có khách hàng hợp lệ",
    CUSTOMER_NO_EMPLOYEE: "Khách hàng chưa được gắn nhân viên bán hàng",
    INVALID_CUSTOMER_EMPLOYEE: "Nhân viên của khách hàng không hợp lệ",
    MISSING_ORDER: "Không tìm thấy đơn hàng của phiếu xuất",
    ORDER_NO_EMPLOYEE: "Đơn hàng chưa được gắn nhân viên bán hàng",
    INVALID_ORDER_EMPLOYEE: "Nhân viên của đơn hàng không hợp lệ",
}

export default function ReturnSalesEmployeeRepairToolPage() {
    const [result, setResult] = useState<ReturnSalesEmployeeRepairResult>()
    const [checking, setChecking] = useState(false)
    const [applying, setApplying] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [extraUnresolvedRows, setExtraUnresolvedRows] = useState<ReturnSalesEmployeeRepairRow[]>([])
    const busy = checking || applying || loadingMore
    const visibleUnresolvedCount = (result?.unresolved_rows?.length ?? 0) + extraUnresolvedRows.length

    const handleCheck = async () => {
        try {
            setChecking(true)
            setResult(await checkReturnSalesEmployeeRepair())
            setExtraUnresolvedRows([])
            toast.success("Đã quét giao dịch trả hàng")
        } catch (error: any) {
            toast.error(error?.message || "Không thể kiểm tra dữ liệu")
        } finally {
            setChecking(false)
        }
    }

    const handleApply = async () => {
        if (!result?.mappable) return
        if (!window.confirm(
            `Xác nhận fill nhân viên bán hàng cho tối đa ${result.mappable} dòng giao dịch trả hàng đang thiếu?\n\nPhiếu trả không có phiếu xuất và không có nhân viên đã lưu sẽ dùng nhân viên hiện tại của khách hàng. Các dòng không xác định được nhân viên sẽ được giữ nguyên.`
        )) return

        try {
            setApplying(true)
            const after = await applyReturnSalesEmployeeRepair()
            setResult(after)
            setExtraUnresolvedRows([])
            toast.success(`Đã cập nhật ${after.transactions_updated} dòng giao dịch`)
        } catch (error: any) {
            toast.error(error?.message || "Không thể cập nhật dữ liệu")
        } finally {
            setApplying(false)
        }
    }

    const handleLoadMore = async () => {
        if (!result || visibleUnresolvedCount >= result.unmappable) return
        try {
            setLoadingMore(true)
            const rows = await loadUnresolvedReturnSalesEmployees(visibleUnresolvedCount)
            setExtraUnresolvedRows((current) => [...current, ...rows])
        } catch (error: any) {
            toast.error(error?.message || "Không thể tải thêm các dòng cần xử lý")
        } finally {
            setLoadingMore(false)
        }
    }

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">Bổ sung nhân viên bán hàng phiếu trả</h2>
                        <Badge variant="secondary">Bảo trì dữ liệu</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quét các dòng giao dịch trả hàng đã hoàn tất nhưng thiếu mã hoặc tên nhân viên bán hàng.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCheck} disabled={busy}>
                        <Search className="mr-2 h-4 w-4" />{checking ? "Đang quét..." : "Kiểm tra"}
                    </Button>
                    <Button onClick={handleApply} disabled={busy || !result?.mappable}>
                        <DatabaseZap className="mr-2 h-4 w-4" />{applying ? "Đang cập nhật..." : "Fill nhân viên"}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Với phiếu trả cũ không có phiếu xuất và chưa lưu nhân viên, gợi ý được lấy từ nhân viên hiện tại của khách hàng. Hãy xem bảng kết quả trước khi chạy. Nếu đang dùng số liệu doanh số nhân viên đã đồng bộ theo tháng, cần chạy lại bước đồng bộ tháng liên quan sau khi fill.
            </div>

            {result ? (
                <>
                    <div className="grid gap-3 md:grid-cols-4">
                        <Summary label="Giao dịch còn thiếu" value={result.total_missing} />
                        <Summary label="Xác định được nhân viên" value={result.mappable} />
                        <Summary label="Cần xử lý riêng" value={result.unmappable} />
                        <Summary label="Đã cập nhật lần chạy" value={result.transactions_updated} />
                    </div>
                    {result.applied && (
                        <p className="text-sm text-muted-foreground">
                            Đã lưu nhân viên trên {result.returns_updated} phiếu trả độc lập; còn {result.total_missing} dòng giao dịch thiếu thông tin.
                        </p>
                    )}
                    <Card>
                        <CardHeader><CardTitle className="text-base">Cần xử lý riêng ({result.unmappable})</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-3 text-sm">Các dòng này không được tool cập nhật. Đang hiển thị {visibleUnresolvedCount}/{result.unmappable} dòng, kèm lý do cần kiểm tra.</p>
                            <RowsTable rows={[...result.unresolved_rows, ...extraUnresolvedRows]} unresolved />
                            {visibleUnresolvedCount < result.unmappable && (
                                <Button className="mt-3" variant="outline" onClick={handleLoadMore} disabled={busy}>
                                    {loadingMore ? "Đang tải..." : "Xem thêm dòng cần xử lý"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-base">Xác định được nhân viên ({result.mappable})</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-3 text-sm">Nút “Fill nhân viên” chỉ cập nhật nhóm này. Bảng hiển thị tối đa 500 dòng.</p>
                            <RowsTable rows={result.rows} />
                        </CardContent>
                    </Card>
                </>
            ) : <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">Bấm “Kiểm tra” để xem dữ liệu trước khi cập nhật.</div>}
        </Main>
    )
}

function RowsTable({ rows, unresolved = false }: { rows: ReturnSalesEmployeeRepairRow[]; unresolved?: boolean }) {
    if (!rows.length) {
        return <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">Không có dòng nào trong nhóm này.</p>
    }

    return (
        <div className="max-h-[560px] overflow-auto rounded-md border">
            <table className="w-full min-w-[1150px] text-sm">
                <thead className="sticky top-0 bg-muted/70">
                    <tr>
                        <th className="border px-3 py-2 text-left">ID</th>
                        <th className="border px-3 py-2 text-left">Phiếu trả</th>
                        <th className="border px-3 py-2 text-left">Khách hàng</th>
                        <th className="border px-3 py-2 text-left">Sản phẩm</th>
                        <th className="border px-3 py-2 text-left">Nhân viên hiện tại</th>
                        <th className="border px-3 py-2 text-left">{unresolved ? "Lý do chưa fill" : "Sẽ fill"}</th>
                        {!unresolved && <th className="border px-3 py-2 text-left">Nguồn xác định</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="border px-3 py-2 font-mono">{row.id}</td>
                            <td className="border px-3 py-2 font-mono">{row.document_no}</td>
                            <td className="border px-3 py-2">{row.customer_name || row.customer_code || "-"}</td>
                            <td className="border px-3 py-2">{row.product_name || row.product_code || "-"}</td>
                            <td className="border px-3 py-2">{[row.sale_user_code, row.sale_user_name].filter(Boolean).join(" - ") || "-"}</td>
                            <td className="border px-3 py-2 font-medium">
                                {unresolved
                                    ? reasonLabel[row.reason || ""] || "Không xác định được nhân viên"
                                    : `${row.target_employee_code} - ${row.target_employee_name}`}
                            </td>
                            {!unresolved && <td className="border px-3 py-2">{sourceLabel[row.source] || row.source}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function Summary({ label, value }: { label: string; value: number }) {
    return <div className="rounded-md border p-4"><div className="text-muted-foreground text-sm">{label}</div><div className="mt-1 text-xl font-bold tabular-nums">{value.toLocaleString("vi-VN")}</div></div>
}
