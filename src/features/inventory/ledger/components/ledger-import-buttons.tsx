import { useRef, useState, type ChangeEvent, type RefObject } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Copy, Database, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    importOpeningStock,
    importPurchaseStock,
    importVthhDetail,
    type OpeningStockImportResult,
} from "@/api/inventory/lot"
import {
    importInventoryLedgerPrices,
    importProductionCostObjects,
    importPurchaseBasePrices,
    type InventoryLedgerPriceImportResult,
    type ProductionCostObjectImportResult,
} from "@/api/inventory/ledger"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    "Diễn giải",
    "Tên nhà cung cấp",
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
    "Diễn giải",
    "TK Nợ",
    "TK Có",
    "Loại chứng từ",
]

const PRODUCTION_COST_OBJECT_REQUIRED_COLUMNS = [
    "Loại chứng từ",
    "Ngày chứng từ",
    "Số chứng từ",
    "Mã hàng",
    "Tên hàng",
    "Mã kho",
    "Tên kho",
    "Số lô",
    "Nhập",
    "Xuất",
    "Diễn giải",
    "Mã đối tượng hoặc Mã VTHH",
]

const LEDGER_PRICE_IMPORT_REQUIRED_COLUMNS = [
    "Loại chứng từ",
    "Ngày chứng từ",
    "Số chứng từ",
    "Mã hàng",
    "Mã kho",
    "Số lô",
    "Nhập",
    "Xuất",
    "Đơn giá",
]

type ImportGuide = {
    title: string
    description: string
    columns: string[]
    notes: string[]
    inputRef: RefObject<HTMLInputElement | null>
}

type ImportResult = OpeningStockImportResult | ProductionCostObjectImportResult | InventoryLedgerPriceImportResult

type ImportResultDialog = {
    title: string
    result: ImportResult
    mode?: "opening" | "cost-object" | "ledger-price" | "purchase-base-price"
}

function readStructuredResult(result: ProductionCostObjectImportResult | InventoryLedgerPriceImportResult | null) {
    if (!result) {
        return {
            totalRows: 0,
            updated: 0,
            alreadyCorrect: 0,
            skipped: 0,
            failed: 0,
            skippedDocTypes: {} as Record<string, number>,
        }
    }

    const raw = result as ProductionCostObjectImportResult & {
        totalRows?: number
        alreadyCorrect?: number
        skippedDocTypes?: Record<string, number>
    }

    return {
        totalRows: raw.total_rows ?? raw.totalRows ?? 0,
        updated: raw.updated ?? 0,
        alreadyCorrect: raw.already_correct ?? raw.alreadyCorrect ?? 0,
        skipped: raw.skipped ?? 0,
        failed: raw.failed ?? raw.errors?.length ?? 0,
        skippedDocTypes: raw.skipped_doc_types ?? raw.skippedDocTypes ?? {},
    }
}

export function LedgerImportButtons() {
    const queryClient = useQueryClient()
    const openingFileRef = useRef<HTMLInputElement>(null)
    const purchaseFileRef = useRef<HTMLInputElement>(null)
    const purchaseBasePriceFileRef = useRef<HTMLInputElement>(null)
    const vthhDetailFileRef = useRef<HTMLInputElement>(null)
    const productionCostObjectFileRef = useRef<HTMLInputElement>(null)
    const ledgerPriceFileRef = useRef<HTMLInputElement>(null)
    const [guide, setGuide] = useState<ImportGuide | null>(null)
    const [importResultDialog, setImportResultDialog] = useState<ImportResultDialog | null>(null)

    const importOpeningMutation = useMutation({
        mutationFn: importOpeningStock,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)
            if (res.failed > 0) {
                setImportResultDialog({ title: "Lỗi import tồn đầu kỳ", result: res, mode: "opening" })
                toast.warning(`Import tồn đầu kỳ xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }
            setImportResultDialog(null)
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
                setImportResultDialog({ title: "Lỗi import mua hàng", result: res, mode: "opening" })
                toast.warning(`Import mua hàng xong ${res.success} dòng${skippedText}, lỗi ${res.failed} dòng`)
                return
            }
            setImportResultDialog(null)
            toast.success(`Đã import ${res.success} dòng mua hàng${skippedText}`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import mua hàng"),
    })

    const importPurchaseBasePriceMutation = useMutation({
        mutationFn: importPurchaseBasePrices,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)
            await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
            const normalized = readStructuredResult(res)

            if (normalized.totalRows === 0) {
                setImportResultDialog({
                    title: "Lỗi sửa đơn giá vốn",
                    result: {
                        ...res,
                        failed: 1,
                        errors: [
                            {
                                row: 0,
                                message: "File không có dòng dữ liệu sau header. Kiểm tra đúng sheet dữ liệu và đúng tiêu đề cột yêu cầu.",
                            },
                        ],
                    },
                    mode: "purchase-base-price",
                })
                toast.warning("File import không có dòng dữ liệu để xử lý")
                return
            }

            if (res.failed > 0 || res.errors?.length) {
                setImportResultDialog({ title: "Lỗi sửa đơn giá vốn", result: res, mode: "purchase-base-price" })
                toast.warning("Sửa đơn giá vốn có lỗi, chưa cập nhật dữ liệu")
                return
            }

            setImportResultDialog({ title: "Kết quả sửa đơn giá vốn", result: res, mode: "purchase-base-price" })
            toast.success(`Đã cập nhật ${normalized.updated} dòng đơn giá vốn`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể sửa đơn giá vốn"),
    })

    const importVthhDetailMutation = useMutation({
        mutationFn: importVthhDetail,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)
            if (res.failed > 0) {
                setImportResultDialog({ title: "Lỗi import chi tiết VTHH", result: res, mode: "opening" })
                toast.warning(`Import chi tiết VTHH xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }
            setImportResultDialog(null)
            toast.success(`Đã import ${res.success} dòng chi tiết VTHH`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import chi tiết VTHH"),
    })

    const importProductionCostObjectMutation = useMutation({
        mutationFn: importProductionCostObjects,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)
            await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
            handleStructuredResult(res, "mã đối tượng SX", "cost-object")
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import mã đối tượng SX"),
    })

    const importLedgerPriceMutation = useMutation({
        mutationFn: importInventoryLedgerPrices,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)
            await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
            handleStructuredResult(res, "giá nhập/xuất khác", "ledger-price")
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import giá nhập/xuất khác"),
    })

    const handleStructuredResult = (
        res: ProductionCostObjectImportResult | InventoryLedgerPriceImportResult,
        label: string,
        mode: "cost-object" | "ledger-price"
    ) => {
        const normalized = readStructuredResult(res)
        if (normalized.totalRows === 0) {
            setImportResultDialog({
                title: `Lỗi import ${label}`,
                result: {
                    ...res,
                    failed: 1,
                    errors: [
                        {
                            row: 0,
                            message: "File không có dòng dữ liệu sau header. Kiểm tra đúng sheet dữ liệu và đúng tiêu đề cột yêu cầu.",
                        },
                    ],
                },
                mode,
            })
            toast.warning("File import không có dòng dữ liệu để xử lý")
            return
        }
        if (res.failed > 0 || res.errors?.length) {
            setImportResultDialog({ title: `Lỗi import ${label}`, result: res, mode })
            toast.warning(`Import ${label} có lỗi, chưa cập nhật dữ liệu`)
            return
        }
        setImportResultDialog({ title: `Kết quả import ${label}`, result: res, mode })
        toast.success(`Đã cập nhật ${normalized.updated} dòng ${label}`)
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>, mutate: (file: File) => void) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return
        setImportResultDialog(null)
        mutate(file)
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

    const result = importResultDialog?.result
    const structuredResult = importResultDialog?.mode === "cost-object"
        || importResultDialog?.mode === "ledger-price"
        || importResultDialog?.mode === "purchase-base-price"
        ? result as ProductionCostObjectImportResult | InventoryLedgerPriceImportResult
        : null
    const normalized = readStructuredResult(structuredResult)

    return (
        <>
            <ImportFileInput inputRef={openingFileRef} onChange={(event) => handleFileChange(event, importOpeningMutation.mutate)} />
            <ImportFileInput inputRef={purchaseFileRef} onChange={(event) => handleFileChange(event, importPurchaseMutation.mutate)} />
            <ImportFileInput inputRef={purchaseBasePriceFileRef} onChange={(event) => handleFileChange(event, importPurchaseBasePriceMutation.mutate)} />
            <ImportFileInput inputRef={vthhDetailFileRef} onChange={(event) => handleFileChange(event, importVthhDetailMutation.mutate)} />
            <ImportFileInput inputRef={productionCostObjectFileRef} onChange={(event) => handleFileChange(event, importProductionCostObjectMutation.mutate)} />
            <ImportFileInput inputRef={ledgerPriceFileRef} onChange={(event) => handleFileChange(event, importLedgerPriceMutation.mutate)} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                        <Database className="mr-2 h-4 w-4" />
                        Dữ liệu
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem disabled={importOpeningMutation.isPending} onSelect={() => setGuide(openingGuide(openingFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importOpeningMutation.isPending ? "Đang import..." : "Import tồn đầu kỳ"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={importPurchaseMutation.isPending} onSelect={() => setGuide(purchaseGuide(purchaseFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importPurchaseMutation.isPending ? "Đang import..." : "Import mua hàng"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={importPurchaseBasePriceMutation.isPending} onSelect={() => setGuide(purchaseBasePriceGuide(purchaseBasePriceFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importPurchaseBasePriceMutation.isPending ? "Đang sửa..." : "Sửa đơn giá vốn"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={importVthhDetailMutation.isPending} onSelect={() => setGuide(vthhGuide(vthhDetailFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importVthhDetailMutation.isPending ? "Đang import..." : "Import chi tiết VTHH"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={importProductionCostObjectMutation.isPending} onSelect={() => setGuide(productionCostObjectGuide(productionCostObjectFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importProductionCostObjectMutation.isPending ? "Đang import..." : "Import mã đối tượng SX"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={importLedgerPriceMutation.isPending} onSelect={() => setGuide(ledgerPriceGuide(ledgerPriceFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importLedgerPriceMutation.isPending ? "Đang import..." : "Import giá nhập/xuất khác"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
                        <Button variant="outline" onClick={() => setGuide(null)}>Đóng</Button>
                        <Button onClick={chooseFileFromGuide}>
                            <Upload className="mr-2 h-4 w-4" />
                            Chọn file import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!importResultDialog} onOpenChange={(open) => !open && setImportResultDialog(null)}>
                <DialogContent className="w-[calc(100vw-48px)] !max-w-[64rem]">
                    <DialogHeader>
                        <DialogTitle>{importResultDialog?.title}</DialogTitle>
                        <DialogDescription>
                            {structuredResult ? (
                                <>
                                    Đọc {normalized.totalRows} dòng, cập nhật {normalized.updated} dòng,
                                    đã đúng sẵn {normalized.alreadyCorrect} dòng, bỏ qua {normalized.skipped} dòng,
                                    lỗi {normalized.failed} dòng.
                                </>
                            ) : (
                                <>
                                    Đã import {result?.success ?? 0} dòng, lỗi {result?.failed ?? 0} dòng.
                                    Kiểm tra lại các dòng dưới đây trong file rồi import lại.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {Object.keys(normalized.skippedDocTypes).length ? (
                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                            <div className="mb-1 font-medium">Loại chứng từ đã bỏ qua</div>
                            <div className="space-y-1 text-muted-foreground">
                                {Object.entries(normalized.skippedDocTypes).map(([label, count]) => (
                                    <div key={label}>{label || "(trống)"}: {count} dòng</div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {(result?.errors || []).length ? (
                        <div className="max-h-[520px] overflow-auto rounded-md border">
                            <table className="w-full border-collapse text-sm">
                                <thead className="sticky top-0 bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="w-24 border-b px-3 py-2 text-left font-medium">Dòng</th>
                                        <th className="border-b px-3 py-2 text-left font-medium">Lý do lỗi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(result?.errors || []).map((error, index) => (
                                        <tr key={`${error.row}-${index}`} className="border-b last:border-b-0">
                                            <td className="px-3 py-2 align-top font-medium">{error.row}</td>
                                            <td className="px-3 py-2 align-top text-muted-foreground">{error.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">
                            Import hoàn tất, không có lỗi.
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportResultDialog(null)}>Đóng</Button>
                        {(result?.errors || []).length ? (
                            <Button variant="outline" onClick={copyImportErrors}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy lỗi
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function ImportFileInput({ inputRef, onChange }: { inputRef: RefObject<HTMLInputElement | null>; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={onChange}
        />
    )
}

function openingGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Import tồn đầu kỳ",
        description: "File import tồn đầu kỳ cần có đủ các cột sau.",
        columns: OPENING_STOCK_REQUIRED_COLUMNS,
        notes: [
            "Hạn sử dụng bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
            "Đơn giá của tồn đầu kỳ được hiểu là giá vốn đầu kỳ đã chốt tại thời điểm mở sổ, không phải đơn giá mua gốc và không cộng thêm phí lô hàng lịch sử.",
        ],
        inputRef,
    }
}

function purchaseGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Import mua hàng",
        description: "File import mua hàng cần có đủ các cột sau.",
        columns: PURCHASE_STOCK_REQUIRED_COLUMNS,
        notes: [
            "Hạn sử dụng và Ngày hạch toán bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
            "Dòng có Mã hàng bắt đầu bằng PHI hoặc dòng không có Mã kho sẽ được bỏ qua. Mã hàng khác nếu chưa có trong danh mục sản phẩm sẽ báo lỗi.",
            "Đơn giá được hiểu là đơn giá mua gốc, chưa bao gồm phí lô hàng. Phí hàng về kho và đơn giá sau phí sẽ được tính ở chức năng Tính giá tồn kho.",
            "Import lại cùng file không tạo trùng giao dịch. Nếu dòng mua hàng đã tồn tại nhưng đơn giá khác, dùng nút Sửa đơn giá vốn.",
        ],
        inputRef,
    }
}

function purchaseBasePriceGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Sửa đơn giá vốn",
        description: "File này dùng để cập nhật lại đơn giá mua gốc cho các dòng mua hàng đã có trong Sổ kho.",
        columns: PURCHASE_STOCK_REQUIRED_COLUMNS,
        notes: [
            "File dùng lại format của Import mua hàng.",
            "Đơn giá mới sẽ ghi vào inventory_ledger.unit_price và inventory_ledger.amount theo đơn giá mua gốc. Đơn giá cũ được backup vào legacy_unit_price nếu chưa có.",
            "Nếu dòng sổ kho không tìm thấy hoặc số dòng trùng khóa giữa DB và Excel không khớp, hệ thống báo lỗi và rollback toàn bộ.",
            "Sau khi cập nhật sổ kho, hệ thống tính lại inventory_lots.unit_cost theo bình quân các dòng mua hàng dương của lô đó.",
        ],
        inputRef,
    }
}

function vthhGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Import chi tiết VTHH",
        description: "File import chi tiết VTHH cần có đủ các cột sau.",
        columns: VTHH_DETAIL_REQUIRED_COLUMNS,
        notes: [
            "Loại chứng từ nhập đúng tên tiếng Việt, ví dụ: Nhập kho khác, Xuất kho khác, Xuất kho sản xuất.",
            "Ngày chứng từ và Hạn sử dụng bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
        ],
        inputRef,
    }
}

function productionCostObjectGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Import mã đối tượng SX",
        description: "File này chỉ bổ sung Mã đối tượng cho dòng Xuất kho sản xuất đã có trong Sổ kho, không tạo giao dịch mới.",
        columns: PRODUCTION_COST_OBJECT_REQUIRED_COLUMNS,
        notes: [
            "Hệ thống chỉ xử lý Loại chứng từ: Xuất kho sản xuất và Nhập kho thành phẩm sản xuất. Các loại chứng từ khác sẽ được bỏ qua và báo số dòng bỏ qua.",
            "Dòng Xuất kho sản xuất bắt buộc có Mã đối tượng. Nếu file kế toán đang dùng tên cột Mã VTHH thì hệ thống cũng hiểu đây là Mã đối tượng.",
            "Trong cùng Ngày chứng từ phải có dòng Nhập kho thành phẩm sản xuất có Mã hàng bằng Mã đối tượng.",
            "Nếu cùng ngày có nhiều dòng Nhập kho thành phẩm sản xuất cho cùng mã thành phẩm, hệ thống sẽ ghép theo mã lệnh trong cột Diễn giải dạng <01941>.",
            "Nếu Diễn giải không có mã lệnh, hệ thống sẽ thử ghép theo thứ tự file. Chỉ cập nhật khi danh sách NVL và tỷ lệ số lượng khớp rõ ràng.",
            "Ngày chứng từ bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy.",
            "Import nhiều lần cùng file sẽ không tạo trùng dữ liệu; dòng đã đúng sẽ được tính là đã đúng sẵn.",
        ],
        inputRef,
    }
}

function ledgerPriceGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Import giá nhập/xuất khác",
        description: "File này chỉ cập nhật đơn giá và thành tiền cho các dòng Sổ kho đã có, không tạo giao dịch mới.",
        columns: LEDGER_PRICE_IMPORT_REQUIRED_COLUMNS,
        notes: [
            "Chỉ xử lý các loại chứng từ: Hàng mua trả lại - Giảm trừ công nợ, Nhập kho khác, Nhập kho từ hàng bán trả lại, Xuất chuyển kho nội bộ, Xuất kho khác.",
            "Dòng nhập lấy số lượng ở cột Nhập; dòng xuất lấy số lượng ở cột Xuất. Riêng Xuất chuyển kho nội bộ có thể có cả dòng Nhập và dòng Xuất tương ứng.",
            "Ngày chứng từ bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy.",
            "Hệ thống chỉ cập nhật khi đơn giá hiện tại trong Sổ kho đang bằng 0. Nếu dòng đã có đơn giá khác, import sẽ báo lỗi và rollback toàn bộ.",
            "Không cập nhật giá trong Tồn theo lô; chỉ cập nhật inventory_ledger và chi tiết phiếu nếu dòng sổ kho có liên kết phiếu.",
        ],
        inputRef,
    }
}

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
    await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
}
