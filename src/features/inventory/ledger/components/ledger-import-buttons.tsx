import { useRef, useState, type ChangeEvent, type RefObject } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Copy, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    importOpeningStock,
    importPurchaseStock,
    importVthhDetail,
    type OpeningStockImportResult,
} from "@/api/inventory/lot"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const OPENING_STOCK_REQUIRED_COLUMNS = [
    "Mã kho",
    "Tên kho",
    "Mã hàng",
    "Tên hàng",
    "Số lô",
    "Hạn sử dụng",
    "ĐVT",
    "Số lượng tồn",
    "Đơn giá",
]

const PURCHASE_STOCK_REQUIRED_COLUMNS = [
    "Ngày hạch toán",
    "Số chứng từ",
    "Mã hàng",
    "Tên hàng",
    "Số lô",
    "Hạn sử dụng",
    "ĐVT",
    "Số lượng mua",
    "Số lượng trả lại",
    "Mã kho",
    "Đơn giá",
    "Phí hàng về kho",
    "Đơn giá bao gồm PLH",
    "TK Nợ",
    "TK Có",
]

const VTHH_DETAIL_REQUIRED_COLUMNS = [
    "Ngày chứng từ",
    "Số chứng từ",
    "Mã hàng",
    "Tên hàng",
    "ĐVT",
    "Mã kho",
    "Tên kho",
    "Số lô",
    "Hạn sử dụng",
    "Nhập",
    "Xuất",
    "TK Nợ",
    "TK Có",
    "Loại chứng từ",
]

type ImportGuide = {
    title: string
    description: string
    columns: string[]
    notes: string[]
    inputRef: RefObject<HTMLInputElement | null>
}

type ImportResultDialog = {
    title: string
    result: OpeningStockImportResult
}

export function LedgerImportButtons() {
    const queryClient = useQueryClient()
    const openingFileRef = useRef<HTMLInputElement>(null)
    const purchaseFileRef = useRef<HTMLInputElement>(null)
    const vthhDetailFileRef = useRef<HTMLInputElement>(null)
    const [guide, setGuide] = useState<ImportGuide | null>(null)
    const [importResultDialog, setImportResultDialog] = useState<ImportResultDialog | null>(null)

    const importOpeningMutation = useMutation({
        mutationFn: importOpeningStock,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)
            setImportResultDialog(res.failed > 0 ? { title: "Lỗi import tồn đầu kỳ", result: res } : null)

            if (res.failed > 0) {
                toast.warning(`Import tồn đầu kỳ xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }

            toast.success(`Đã import ${res.success} dòng tồn đầu kỳ`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import tồn đầu kỳ"),
    })

    const importPurchaseMutation = useMutation({
        mutationFn: importPurchaseStock,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)

            const skippedText = res.skipped ? `, bỏ qua ${res.skipped} dòng` : ""
            if (res.failed > 0) {
                setImportResultDialog({ title: "Lỗi import mua hàng", result: res })
                toast.warning(`Import mua hàng xong ${res.success} dòng${skippedText}, lỗi ${res.failed} dòng`)
                return
            }

            setImportResultDialog(null)
            toast.success(`Đã import ${res.success} dòng mua hàng${skippedText}`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import mua hàng"),
    })

    const importVthhDetailMutation = useMutation({
        mutationFn: importVthhDetail,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)

            if (res.failed > 0) {
                setImportResultDialog({ title: "Lỗi import chi tiết VTHH", result: res })
                toast.warning(`Import chi tiết VTHH xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }

            setImportResultDialog(null)
            toast.success(`Đã import ${res.success} dòng chi tiết VTHH`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import chi tiết VTHH"),
    })

    const handleOpeningFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        setImportResultDialog(null)
        importOpeningMutation.mutate(file)
    }

    const handlePurchaseFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        setImportResultDialog(null)
        importPurchaseMutation.mutate(file)
    }

    const handleVthhDetailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        setImportResultDialog(null)
        importVthhDetailMutation.mutate(file)
    }

    const openOpeningFilePicker = () => {
        setGuide({
            title: "Import tồn đầu kỳ",
            description: "File import tồn đầu kỳ cần có đủ các cột sau.",
            columns: OPENING_STOCK_REQUIRED_COLUMNS,
            notes: [
                "Hạn sử dụng bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
            ],
            inputRef: openingFileRef,
        })
    }

    const openPurchaseFilePicker = () => {
        setGuide({
            title: "Import mua hàng",
            description: "File import mua hàng cần có đủ các cột sau.",
            columns: PURCHASE_STOCK_REQUIRED_COLUMNS,
            notes: [
                "Hạn sử dụng và Ngày hạch toán bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
                "Dòng có Mã hàng bắt đầu bằng PHI hoặc Mã hàng chưa có trong danh mục sản phẩm sẽ được bỏ qua.",
                "Phí hàng về kho chưa được tính vào giá ở bước import này.",
            ],
            inputRef: purchaseFileRef,
        })
    }

    const openVthhDetailFilePicker = () => {
        setGuide({
            title: "Import chi tiết VTHH",
            description: "File import chi tiết VTHH cần có đủ các cột sau.",
            columns: VTHH_DETAIL_REQUIRED_COLUMNS,
            notes: [
                "Loại chứng từ nhập đúng tên tiếng Việt, ví dụ: Nhập kho khác, Xuất kho khác, Xuất kho sản xuất.",
                "Ngày chứng từ và Hạn sử dụng bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
            ],
            inputRef: vthhDetailFileRef,
        })
    }

    const chooseFileFromGuide = () => {
        const inputRef = guide?.inputRef
        setGuide(null)
        window.setTimeout(() => inputRef?.current?.click(), 0)
    }

    const copyImportErrors = async () => {
        if (!importResultDialog?.result.errors?.length) return
        const text = importResultDialog.result.errors
            .map((error) => `Dòng ${error.row}: ${error.message}`)
            .join("\n")

        await navigator.clipboard.writeText(text)
        toast.success("Đã copy danh sách lỗi")
    }

    return (
        <>
            <input
                ref={openingFileRef}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleOpeningFileChange}
            />
            <input
                ref={purchaseFileRef}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handlePurchaseFileChange}
            />
            <input
                ref={vthhDetailFileRef}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleVthhDetailFileChange}
            />
            <Button
                size="sm"
                variant="outline"
                disabled={importOpeningMutation.isPending}
                onClick={openOpeningFilePicker}
            >
                <Upload className="mr-2 h-4 w-4" />
                {importOpeningMutation.isPending ? "Đang import..." : "Import tồn đầu kỳ"}
            </Button>
            <Button
                size="sm"
                variant="outline"
                disabled={importPurchaseMutation.isPending}
                onClick={openPurchaseFilePicker}
            >
                <Upload className="mr-2 h-4 w-4" />
                {importPurchaseMutation.isPending ? "Đang import..." : "Import mua hàng"}
            </Button>
            <Button
                size="sm"
                variant="outline"
                disabled={importVthhDetailMutation.isPending}
                onClick={openVthhDetailFilePicker}
            >
                <Upload className="mr-2 h-4 w-4" />
                {importVthhDetailMutation.isPending ? "Đang import..." : "Import chi tiết VTHH"}
            </Button>

            <Dialog open={!!guide} onOpenChange={(open) => !open && setGuide(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{guide?.title}</DialogTitle>
                        <DialogDescription>{guide?.description}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-md border bg-muted/30 p-3">
                            <div className="mb-2 text-sm font-medium">Tiêu đề cột cần có</div>
                            <pre className="max-h-[320px] select-text overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-sm leading-6 text-foreground">
                                {(guide?.columns || []).join("\n")}
                            </pre>
                        </div>

                        {guide?.notes?.length ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                                {guide.notes.map((note) => (
                                    <p key={note}>{note}</p>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGuide(null)}>
                            Đóng
                        </Button>
                        <Button onClick={chooseFileFromGuide}>
                            <Upload className="mr-2 h-4 w-4" />
                            Chọn file import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!importResultDialog} onOpenChange={(open) => !open && setImportResultDialog(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{importResultDialog?.title}</DialogTitle>
                        <DialogDescription>
                            Đã import {importResultDialog?.result.success ?? 0} dòng, lỗi {importResultDialog?.result.failed ?? 0} dòng.
                            Kiểm tra lại các dòng dưới đây trong file rồi import lại.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[520px] overflow-auto rounded-md border">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-muted text-muted-foreground">
                                <tr>
                                    <th className="w-24 border-b px-3 py-2 text-left font-medium">Dòng</th>
                                    <th className="border-b px-3 py-2 text-left font-medium">Lý do lỗi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(importResultDialog?.result.errors || []).map((error, index) => (
                                    <tr key={`${error.row}-${index}`} className="border-b last:border-b-0">
                                        <td className="px-3 py-2 align-top font-medium">{error.row}</td>
                                        <td className="px-3 py-2 align-top text-muted-foreground">{error.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportResultDialog(null)}>
                            Đóng
                        </Button>
                        <Button variant="outline" onClick={copyImportErrors}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy lỗi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
    await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
}
