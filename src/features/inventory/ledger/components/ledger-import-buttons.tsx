import { useRef, useState, type ChangeEvent, type RefObject } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Copy, Database, FileCheck2, FileUp, Loader2, PlayCircle, RotateCcw, ShieldCheck, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    importOpeningStock,
    importPurchaseStock,
    importVthhDetail,
    type OpeningStockImportResult,
} from "@/api/inventory/lot"
import { getMyPermissions } from "@/api/auth/permission"
import {
    importInventoryLedgerPrices,
    importProductionCostObjects,
    importPurchaseBasePrices,
    runOpeningCostNormalizationStep,
    uploadOpeningCostNormalization,
    type OpeningCostNormalizationRun,
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
    "Diễn giải",
    "Tên nhà cung cấp",
    "TK Nợ",
    "TK Có",
]

const PURCHASE_PRICE_REQUIRED_COLUMNS = [
    "Ngày hạch toán",
    "Số chứng từ",
    "Mã hàng",
    "Tên hàng",
    "Số lô",
    "Số lượng mua",
    "Mã kho",
    "Tổng giá trị",
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
    "Tổng giá trị",
]

type ImportGuide = {
    title: string
    description: string
    columns: string[]
    optionalColumns?: string[]
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
            toUpdate: 0,
            changed: 0,
            skipped: 0,
            failed: 0,
            preview: false,
            requiresConfirm: false,
            pendingChanges: [] as NonNullable<ProductionCostObjectImportResult["pending_changes"]>,
            skippedDocTypes: {} as Record<string, number>,
        }
    }

    const raw = result as ProductionCostObjectImportResult & {
        totalRows?: number
        alreadyCorrect?: number
        toUpdate?: number
        requiresConfirm?: boolean
        pendingChanges?: ProductionCostObjectImportResult["pending_changes"]
        skippedDocTypes?: Record<string, number>
    }

    return {
        totalRows: raw.total_rows ?? raw.totalRows ?? 0,
        updated: raw.updated ?? 0,
        alreadyCorrect: raw.already_correct ?? raw.alreadyCorrect ?? 0,
        toUpdate: raw.to_update ?? raw.toUpdate ?? 0,
        changed: raw.changed ?? 0,
        skipped: raw.skipped ?? 0,
        failed: raw.failed ?? raw.errors?.length ?? 0,
        preview: !!raw.preview,
        requiresConfirm: raw.requires_confirm ?? raw.requiresConfirm ?? false,
        pendingChanges: raw.pending_changes ?? raw.pendingChanges ?? [],
        skippedDocTypes: raw.skipped_doc_types ?? raw.skippedDocTypes ?? {},
    }
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) =>
        (permission.module === module && permission.action === action)
        || permission.module === "*"
        || permission.action === "*",
    )
}

export function LedgerImportButtons() {
    const queryClient = useQueryClient()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUseDataMenu = hasPermission(permissions, "inventory.ledgers", "data-admin")
    const openingFileRef = useRef<HTMLInputElement>(null)
    const purchaseFileRef = useRef<HTMLInputElement>(null)
    const purchaseBasePriceFileRef = useRef<HTMLInputElement>(null)
    const vthhDetailFileRef = useRef<HTMLInputElement>(null)
    const productionCostObjectFileRef = useRef<HTMLInputElement>(null)
    const ledgerPriceFileRef = useRef<HTMLInputElement>(null)
    const [guide, setGuide] = useState<ImportGuide | null>(null)
    const [importResultDialog, setImportResultDialog] = useState<ImportResultDialog | null>(null)
    const [pendingCostObjectFile, setPendingCostObjectFile] = useState<File | null>(null)
    const [activeImport, setActiveImport] = useState<{ label: string; fileName: string } | null>(null)
    const [normalizationOpen, setNormalizationOpen] = useState(false)

    const importOpeningMutation = useMutation({
        mutationFn: importOpeningStock,
        onSuccess: async (res) => {
            setActiveImport(null)
            await invalidateInventoryQueries(queryClient)
            if (res.failed > 0) {
                setImportResultDialog({ title: "Lỗi import tồn đầu kỳ", result: res, mode: "opening" })
                toast.warning(`Import tồn đầu kỳ xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }
            setImportResultDialog(null)
            toast.success(`Đã import ${res.success} dòng tồn đầu kỳ`)
        },
        onError: (error: any) => {
            setActiveImport(null)
            toast.error(error?.message || "Không thể import tồn đầu kỳ")
        },
    })

    const importPurchaseMutation = useMutation({
        mutationFn: importPurchaseStock,
        onSuccess: async (res) => {
            setActiveImport(null)
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
        onError: (error: any) => {
            setActiveImport(null)
            toast.error(error?.message || "Không thể import mua hàng")
        },
    })

    const importPurchaseBasePriceMutation = useMutation({
        mutationFn: importPurchaseBasePrices,
        onSuccess: async (res) => {
            setActiveImport(null)
            await invalidateInventoryQueries(queryClient)
            await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
            const normalized = readStructuredResult(res)

            if (normalized.totalRows === 0) {
                setImportResultDialog({
                    title: "Lỗi sửa đơn giá mua hàng",
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
                setImportResultDialog({ title: "Lỗi sửa đơn giá mua hàng", result: res, mode: "purchase-base-price" })
                toast.warning("Sửa đơn giá mua hàng có lỗi, chưa cập nhật dữ liệu")
                return
            }

            setImportResultDialog({ title: "Kết quả sửa đơn giá mua hàng", result: res, mode: "purchase-base-price" })
            toast.success(`Đã cập nhật ${normalized.updated} dòng đơn giá mua hàng`)
        },
        onError: (error: any) => {
            setActiveImport(null)
            toast.error(error?.message || "Không thể sửa đơn giá mua hàng")
        },
    })

    const importVthhDetailMutation = useMutation({
        mutationFn: importVthhDetail,
        onSuccess: async (res) => {
            setActiveImport(null)
            await invalidateInventoryQueries(queryClient)
            if (res.failed > 0) {
                setImportResultDialog({ title: "Lỗi import chi tiết VTHH", result: res, mode: "opening" })
                toast.warning(`Import chi tiết VTHH xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }
            setImportResultDialog(null)
            toast.success(`Đã import ${res.success} dòng chi tiết VTHH`)
        },
        onError: (error: any) => {
            setActiveImport(null)
            toast.error(error?.message || "Không thể import chi tiết VTHH")
        },
    })

    const importProductionCostObjectMutation = useMutation({
        mutationFn: ({ file, confirm = false }: { file: File; confirm?: boolean }) => importProductionCostObjects(file, confirm),
        onSuccess: async (res) => {
            setActiveImport(null)
            if (!res.preview) {
                await invalidateInventoryQueries(queryClient)
                await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                setPendingCostObjectFile(null)
            }
            handleStructuredResult(res, "mã đối tượng SX", "cost-object")
        },
        onError: (error: any) => {
            setActiveImport(null)
            toast.error(error?.message || "Không thể import mã đối tượng SX")
        },
    })

    const importLedgerPriceMutation = useMutation({
        mutationFn: importInventoryLedgerPrices,
        onSuccess: async (res) => {
            setActiveImport(null)
            await invalidateInventoryQueries(queryClient)
            await queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
            handleStructuredResult(res, "giá nhập/xuất khác", "ledger-price")
        },
        onError: (error: any) => {
            setActiveImport(null)
            toast.error(error?.message || "Không thể import giá nhập/xuất khác")
        },
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
        if (mode === "cost-object" && normalized.requiresConfirm) {
            setImportResultDialog({ title: `Xác nhận import ${label}`, result: res, mode })
            toast.warning(`File có ${normalized.pendingChanges.length} thay đổi mã đối tượng, cần xác nhận trước khi cập nhật`)
            return
        }
        setImportResultDialog({ title: `Kết quả import ${label}`, result: res, mode })
        if (normalized.preview) {
            toast.success(`Kiểm tra xong: ${normalized.alreadyCorrect} dòng đã đúng sẵn, không có thay đổi cần cập nhật`)
        } else {
            toast.success(`Đã cập nhật ${normalized.updated} dòng ${label}`)
        }
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>, label: string, mutate: (file: File) => void) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return
        setGuide(null)
        setImportResultDialog(null)
        setActiveImport({ label, fileName: file.name })
        mutate(file)
    }

    const handleProductionCostObjectFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return
        setGuide(null)
        setPendingCostObjectFile(file)
        setImportResultDialog(null)
        setActiveImport({ label: "Import mã đối tượng SX", fileName: file.name })
        importProductionCostObjectMutation.mutate({ file })
    }

    const confirmProductionCostObjectImport = () => {
        if (!pendingCostObjectFile) return
        importProductionCostObjectMutation.mutate({ file: pendingCostObjectFile, confirm: true })
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
            <ImportFileInput inputRef={openingFileRef} onChange={(event) => handleFileChange(event, "Import tồn đầu kỳ", importOpeningMutation.mutate)} />
            <ImportFileInput inputRef={purchaseFileRef} onChange={(event) => handleFileChange(event, "Import mua hàng", importPurchaseMutation.mutate)} />
            <ImportFileInput inputRef={purchaseBasePriceFileRef} onChange={(event) => handleFileChange(event, "Sửa đơn giá mua hàng", importPurchaseBasePriceMutation.mutate)} />
            <ImportFileInput inputRef={vthhDetailFileRef} onChange={(event) => handleFileChange(event, "Import chi tiết VTHH", importVthhDetailMutation.mutate)} />
            <ImportFileInput inputRef={productionCostObjectFileRef} onChange={handleProductionCostObjectFileChange} />
            <ImportFileInput inputRef={ledgerPriceFileRef} onChange={(event) => handleFileChange(event, "Import giá nhập/xuất khác", importLedgerPriceMutation.mutate)} />

            {canUseDataMenu ? (
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
                        <DropdownMenuItem onSelect={() => setNormalizationOpen(true)}>
                            <ShieldCheck className="h-4 w-4" />
                            Chuẩn hóa đơn giá đầu kỳ
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        Import nghiệp vụ
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem disabled={importPurchaseMutation.isPending} onSelect={() => setGuide(purchaseGuide(purchaseFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importPurchaseMutation.isPending ? "Đang import..." : "Import mua hàng"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={importPurchaseBasePriceMutation.isPending} onSelect={() => setGuide(purchaseBasePriceGuide(purchaseBasePriceFileRef))}>
                        <Upload className="h-4 w-4" />
                        {importPurchaseBasePriceMutation.isPending ? "Đang sửa..." : "Sửa đơn giá mua hàng"}
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

            <OpeningCostNormalizationDialog
                open={normalizationOpen}
                onOpenChange={setNormalizationOpen}
                onChanged={() => invalidateInventoryQueries(queryClient)}
            />

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
                        {guide?.optionalColumns?.length ? (
                            <div className="rounded-md border bg-muted/30 p-3">
                                <div className="mb-2 text-sm font-medium">Cột tùy chọn</div>
                                <pre className="max-h-[200px] select-text overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-sm leading-6 text-foreground">
                                    {guide.optionalColumns.join("\n")}
                                </pre>
                            </div>
                        ) : null}
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

            <Dialog open={!!activeImport}>
                <DialogContent className="max-w-md" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Đang xử lý file
                        </DialogTitle>
                        <DialogDescription>
                            {activeImport?.label} đang chạy. Vui lòng chờ đến khi hệ thống trả kết quả.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <div className="font-medium text-foreground">{activeImport?.fileName}</div>
                        <div className="mt-1 text-muted-foreground">Đang upload, kiểm tra và cập nhật trong transaction.</div>
                    </div>
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
                                    chờ cập nhật {normalized.toUpdate + normalized.changed} dòng,
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

                    {structuredResult && normalized.pendingChanges.length ? (
                        <div className="max-h-[360px] overflow-auto rounded-md border">
                            <table className="w-full border-collapse text-sm">
                                <thead className="sticky top-0 bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="w-20 border-b px-3 py-2 text-left font-medium">Dòng</th>
                                        <th className="border-b px-3 py-2 text-left font-medium">Chứng từ</th>
                                        <th className="border-b px-3 py-2 text-left font-medium">Mã hàng</th>
                                        <th className="border-b px-3 py-2 text-left font-medium">Kho/Lô</th>
                                        <th className="border-b px-3 py-2 text-left font-medium">Mã cũ</th>
                                        <th className="border-b px-3 py-2 text-left font-medium">Mã mới</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {normalized.pendingChanges.map((change, index) => {
                                        const row = change.row
                                        const docNo = change.docNo ?? change.doc_no ?? "-"
                                        const postingDate = change.postingDate ?? change.posting_date ?? "-"
                                        const productCode = change.productCode ?? change.product_code ?? "-"
                                        const warehouseCode = change.warehouseCode ?? change.warehouse_code ?? "-"
                                        const lotNo = change.lotNo ?? change.lot_no ?? "-"
                                        const oldCode = change.oldCostObjectCode ?? change.old_cost_object_code ?? "(trống)"
                                        const newCode = change.newCostObjectCode ?? change.new_cost_object_code ?? "-"
                                        return (
                                            <tr key={`${row}-${index}`} className="border-b last:border-b-0">
                                                <td className="px-3 py-2 align-top font-medium">{row}</td>
                                                <td className="px-3 py-2 align-top text-muted-foreground">{docNo}<br />{postingDate}</td>
                                                <td className="px-3 py-2 align-top">{productCode}</td>
                                                <td className="px-3 py-2 align-top text-muted-foreground">{warehouseCode}<br />{lotNo}</td>
                                                <td className="px-3 py-2 align-top text-muted-foreground">{oldCode}</td>
                                                <td className="px-3 py-2 align-top font-medium">{newCode}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
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
                            {structuredResult && normalized.requiresConfirm
                                ? "File hợp lệ, chưa cập nhật dữ liệu. Kiểm tra danh sách thay đổi rồi xác nhận."
                                : normalized.preview
                                    ? "File hợp lệ, không có lỗi và không có thay đổi cần cập nhật."
                                    : "Import hoàn tất, không có lỗi."}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportResultDialog(null)}>Đóng</Button>
                        {structuredResult && normalized.requiresConfirm ? (
                            <Button disabled={!pendingCostObjectFile || importProductionCostObjectMutation.isPending} onClick={confirmProductionCostObjectImport}>
                                {importProductionCostObjectMutation.isPending ? "Đang cập nhật..." : "Xác nhận cập nhật"}
                            </Button>
                        ) : null}
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

function OpeningCostNormalizationDialog({
    open,
    onOpenChange,
    onChanged,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [run, setRun] = useState<OpeningCostNormalizationRun | null>(null)
    const [errorText, setErrorText] = useState<string | null>(null)

    const uploadMutation = useMutation({
        mutationFn: uploadOpeningCostNormalization,
        onSuccess: (data) => {
            setRun(data)
            setErrorText(null)
            toast.success("Đã tải file chuẩn hóa đầu kỳ")
        },
        onError: (error: any) => setErrorText(error?.message || "Không tải được file"),
    })

    const stepMutation = useMutation({
        mutationFn: ({ runId, step }: { runId: number; step: Parameters<typeof runOpeningCostNormalizationStep>[1] }) =>
            runOpeningCostNormalizationStep(runId, step),
        onSuccess: async (data) => {
            setRun(data)
            setErrorText(null)
            if (["APPLIED", "DOWNSTREAM_NORMALIZED", "RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED", "ROLLED_BACK"].includes(data.status)) {
                await onChanged()
            }
            toast.success(stepSuccessText(data.status))
        },
        onError: (error: any) => setErrorText(error?.message || "Không chạy được bước"),
    })

    const busy = uploadMutation.isPending || stepMutation.isPending
    const status = run?.status || "NEW"
    const canRollback = Boolean(run?.id && !["NEW", "UPLOADED", "CHECKED", "IMPACTED", "COMPLETED", "ROLLED_BACK"].includes(status))

    const uploadFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return
        setRun(null)
        setErrorText(null)
        uploadMutation.mutate(file)
    }

    const runStep = (step: Parameters<typeof runOpeningCostNormalizationStep>[1]) => {
        if (!run?.id) return
        stepMutation.mutate({ runId: run.id, step })
    }

    const check = run?.check || {}
    const impact = run?.impact || {}
    const snapshot = run?.snapshot || {}
    const apply = run?.apply || {}
    const downstream = run?.downstream || {}
    const recalc = run?.recalc || {}
    const audit = run?.audit || {}
    const verify = run?.verify || {}

    return (
        <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            <DialogContent className="flex max-h-[92vh] !w-[min(1080px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Chuẩn hóa đơn giá đầu kỳ</DialogTitle>
                    <DialogDescription>
                        Flow tạm để giữ Thành tiền đầu kỳ đúng theo file phần mềm cũ, tính lại đơn giá 3 chữ số và chỉ cập nhật dữ liệu phát sinh mới có liên kết rõ.
                    </DialogDescription>
                </DialogHeader>

                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={uploadFile}
                />

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                    <div className="rounded-md border bg-muted/20 p-3 text-sm">
                        <div className="font-medium">File import cần có các cột</div>
                        <div className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
                            {["Mã hàng", "Mã kho hoặc Tên kho", "Số lô", "Số lượng", "Thành tiền"].map((column) => (
                                <div key={column} className="rounded border bg-background px-2 py-1">{column}</div>
                            ))}
                        </div>
                        <div className="mt-2 text-muted-foreground">
                            Thành tiền được giữ nguyên theo file; mỗi dòng file phải khớp đúng một lô OPENING theo Mã hàng/Kho/Số lô. Đơn giá mới = Thành tiền / Số lượng, làm tròn HALF_UP đến 3 chữ số thập phân. Dòng Số lượng = 0 được chấp nhận khi Thành tiền = 0.
                        </div>
                    </div>

                    {errorText ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorText}</div>
                    ) : null}

                    {run ? (
                        <div className="grid gap-2 text-sm sm:grid-cols-4">
                            <NormInfo label="Run" value={`#${run.id}`} />
                            <NormInfo label="Trạng thái" value={status} />
                            <NormInfo label="File" value={run.file_name || "-"} />
                            <NormInfo label="Số dòng file" value={fmt(run.import_rows)} />
                        </div>
                    ) : null}

                    {run ? (
                        <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                            <div className="font-medium">Nghiệp vụ chuẩn hóa này làm gì?</div>
                            <div className="mt-1 space-y-1 text-blue-800">
                                <div>1. Lấy Thành tiền trong file phần mềm cũ làm số chuẩn của tồn đầu kỳ.</div>
                                <div>2. Tìm đúng lô tồn đầu kỳ trong DB theo Mã hàng + Kho + Số lô. Nếu không khớp số lô, hệ thống báo lỗi và không tự phân bổ sang lô khác.</div>
                                <div>3. Tính lại đơn giá lô = Thành tiền / Số lượng, làm tròn 3 chữ số thập phân.</div>
                                <div>4. Cập nhật lại giá vốn các phát sinh mới có link trực tiếp tới lô đầu kỳ đó; dữ liệu legacy/import cũ không có link rõ chỉ được thống kê bỏ qua.</div>
                                <div>5. Sau cùng audit trace giá vốn, tính lại costing và chỉ hoàn tất khi Tổng DB = Tổng file, Lệch = 0.</div>
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <NormalizationStep
                            title="1. Upload file"
                            description="Tải file chứa Thành tiền chuẩn từ phần mềm cũ."
                            done={Boolean(run?.id)}
                            disabled={busy}
                            buttonText="Chọn file"
                            onClick={() => fileRef.current?.click()}
                        />
                        <NormalizationStep
                            title="2. Kiểm tra tồn đầu kỳ"
                            description="Đối chiếu Mã hàng/Kho/Số lô/Số lượng với tồn đầu kỳ trong DB và tính thử đơn giá mới."
                            done={["CHECKED", "IMPACTED", "SNAPSHOT_CREATED", "APPLIED", "DOWNSTREAM_NORMALIZED", "RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={!run?.id || busy || status === "COMPLETED"}
                            buttonText="Kiểm tra"
                            onClick={() => runStep("check")}
                        />
                        <NormalizationStep
                            title="3. Phân tích ảnh hưởng"
                            description="Chỉ đọc DB để khoanh vùng lô đầu kỳ, giá vốn đã phát sinh và các kỳ costing cần chạy lại; chưa sửa dữ liệu."
                            done={["IMPACTED", "SNAPSHOT_CREATED", "APPLIED", "DOWNSTREAM_NORMALIZED", "RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={status !== "CHECKED" || busy}
                            buttonText="Phân tích"
                            onClick={() => runStep("impact")}
                        />
                        <NormalizationStep
                            title="4. Tạo snapshot rollback"
                            description="Chụp lại từng bản ghi trước khi sửa vào bảng snapshot riêng để có thể quay lại nguyên trạng."
                            done={["SNAPSHOT_CREATED", "APPLIED", "DOWNSTREAM_NORMALIZED", "RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={status !== "IMPACTED" || busy}
                            buttonText="Tạo snapshot"
                            onClick={() => runStep("snapshot")}
                        />
                        <NormalizationStep
                            title="5. Cập nhật tồn đầu kỳ"
                            description="Chốt lại Thành tiền tồn đầu kỳ theo file và cập nhật đơn giá từng lô sau khi phân bổ."
                            done={["APPLIED", "DOWNSTREAM_NORMALIZED", "RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={status !== "SNAPSHOT_CREATED" || busy}
                            buttonText="Cập nhật"
                            onClick={() => runStep("apply-opening")}
                        />
                        <NormalizationStep
                            title="6. Cập nhật giá vốn phát sinh mới"
                            description="Sửa giá vốn các phiếu xuất/chuyển/sản xuất đã lấy giá từ lô đầu kỳ vừa chuẩn hóa."
                            done={["DOWNSTREAM_NORMALIZED", "RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={status !== "APPLIED" || busy}
                            buttonText="Cập nhật giá vốn"
                            onClick={() => runStep("normalize-downstream")}
                        />
                        <NormalizationStep
                            title="7. Đánh dấu kỳ cần tính lại"
                            description="Đánh dấu các kỳ sau tồn đầu kỳ cần tính lại để không dùng lại giá vốn cũ."
                            done={["RECALC_MARKED", "RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={status !== "DOWNSTREAM_NORMALIZED" || busy}
                            buttonText="Đánh dấu"
                            onClick={() => runStep("mark-recalculate")}
                        />
                        <NormalizationStep
                            title="8. Tính lại costing"
                            description="Chạy lại giá vốn các kỳ bị ảnh hưởng theo thứ tự thời gian."
                            done={["RECALCULATED", "AUDITED", "COMPLETED"].includes(status)}
                            disabled={!((status === "RECALC_MARKED") || (status === "FAILED" && run?.audit)) || busy}
                            buttonText="Tính lại"
                            onClick={() => runStep("recalculate")}
                        />
                        <NormalizationStep
                            title="9. Audit trace giá vốn"
                            description="Đọc lại FIFO sản xuất, cost layer, cost consumption, ledger sản xuất và kết quả giá thành để chắc chắn giá đã lan đúng."
                            done={["AUDITED", "COMPLETED"].includes(status)}
                            disabled={!((status === "RECALCULATED") || (status === "FAILED" && run?.audit)) || busy}
                            buttonText="Audit giá vốn"
                            onClick={() => runStep("audit-costing")}
                        />
                        <NormalizationStep
                            title="10. Kiểm tra đối chiếu"
                            description="Đọc lại DB sau khi chạy; đạt khi tổng Thành tiền OPENING bằng đúng tổng file."
                            done={status === "COMPLETED"}
                            disabled={status !== "AUDITED" || busy}
                            buttonText="Kiểm tra cuối"
                            onClick={() => runStep("verify")}
                        />
                    </div>

                    {run ? (
                        <div className="grid gap-3 text-sm lg:grid-cols-2 xl:grid-cols-3">
                            <ResultBox
                                title="2. Kiểm tra trước khi sửa"
                                note="Chỉ đọc file và DB. Dòng lỗi phải bằng 0 mới được đi tiếp; Số lô là bắt buộc và phải khớp đúng lô OPENING."
                                items={[
                                    ["Dòng file tạo cập nhật", fmt(check.validRows)],
                                    ["Dòng bỏ qua", fmt(check.skippedRows)],
                                    ["Dòng lỗi cần sửa", fmt(check.failedRows)],
                                    ["Tổng đang có trong DB", money(check.totalOldAmount)],
                                    ["Tổng theo file", money(check.totalImportedAmount)],
                                    ["Chênh lệch sẽ sửa", money(check.totalDiff)],
                                ]}
                            />
                            <ResultBox
                                title="3. Phạm vi bị ảnh hưởng"
                                note="Cho biết sửa tồn đầu kỳ này sẽ kéo theo bao nhiêu phát sinh mới và kỳ costing cần tính lại."
                                items={[
                                    ["Lô đầu kỳ liên quan", fmt((impact.affectedLotIds || []).length)],
                                    ["Kỳ costing cần tính lại", fmt((impact.affectedPeriodIds || []).length)],
                                    ["Xuất kho bán hàng cần cập nhật", fmt(impact.salesFifoAllocations)],
                                    ["Xuất NVL sản xuất cần cập nhật", fmt(impact.productionFifoAllocations)],
                                    ["Lớp giá vốn cần cập nhật", fmt(impact.costLayers)],
                                    ["Tiêu hao giá vốn cần cập nhật", fmt(impact.costConsumptions)],
                                    ["Dữ liệu legacy/import không sửa", fmt(impact.legacySkippedRows)],
                                ]}
                            />
                            <ResultBox
                                title="4. Snapshot rollback"
                                note="Bản sao trước khi sửa. Nếu rollback, hệ thống phục hồi từ đúng các bản ghi này."
                                items={[
                                    ["Bảng đã snapshot", fmt(snapshot.table_count)],
                                    ["Bản ghi đã snapshot", fmt(snapshot.total_records)],
                                ]}
                            />
                            <ResultBox
                                title="5. Cập nhật tồn đầu kỳ"
                                note="Giữ Thành tiền theo file, phân bổ xuống từng lô và tính lại đơn giá 3 chữ số."
                                items={[
                                    ["Lot đã cập nhật", fmt(apply.updated_lots)],
                                    ["Dòng opening cập nhật", fmt(apply.updated_opening_ledgers)],
                                    ["Dòng phân bổ đã chạy", fmt(apply.normalized_rows)],
                                ]}
                            />
                            <ResultBox
                                title="6. Cập nhật giá vốn phát sinh mới"
                                note="Chỉ sửa phát sinh mới có link trực tiếp tới lô đầu kỳ; dữ liệu import cũ không có link rõ không bị đụng."
                                items={[
                                    ["Xuất kho bán hàng", fmt(downstream.inventory_fifo_allocations)],
                                    ["Xuất NVL sản xuất", fmt(downstream.production_fifo_allocations)],
                                    ["Lớp giá vốn tồn kho", fmt(downstream.inventory_cost_layers)],
                                    ["Dòng tiêu hao giá vốn", fmt(downstream.inventory_cost_consumptions)],
                                ]}
                            />
                            <ResultBox
                                title="7-8. Tính lại costing"
                                note="Không cho dùng lại giá vốn cũ; đánh dấu kỳ cần tính lại rồi chạy costing theo thứ tự thời gian."
                                items={[
                                    ["Dòng ledger đã xóa giá vốn cũ", fmt(recalc.cleared_ledger_rows)],
                                    ["Kỳ đã đánh dấu tính lại", fmt(recalc.periods_marked_stale)],
                                    ["Kỳ đã tính lại", fmt(recalc.recalculated_periods)],
                                ]}
                            />
                            <ResultBox
                                title="9. Audit trace giá vốn"
                                note="Kiểm tra công thức sau chuẩn hóa: FIFO sản xuất, lớp giá vốn, tiêu hao giá vốn, ledger xuất NVL và giá thành thành phẩm."
                                items={[
                                    ["Kết quả", audit.ok === undefined ? "-" : audit.ok ? "Đúng" : "Còn lỗi"],
                                    ["Check lỗi", fmt(audit.failed_checks)],
                                    ["Lô đầu kỳ audit", fmt(audit.affected_lots)],
                                    ["Lệnh/mẻ SX ảnh hưởng", fmt(audit.affected_production_items)],
                                    ["Kỳ costing audit", fmt(audit.affected_periods)],
                                ]}
                            />
                            <ResultBox
                                title="10. Đối chiếu cuối"
                                note="Điều kiện hoàn tất: Tổng DB bằng đúng Tổng file và Lệch = 0."
                                items={[
                                    ["Kết quả", verify.ok === undefined ? "-" : verify.ok ? "Đúng" : "Lệch"],
                                    ["Dòng opening", fmt(verify.opening_rows)],
                                    ["Tổng file", money(verify.file_opening_amount)],
                                    ["Tổng DB", money(verify.db_opening_amount)],
                                    ["Lệch", money(verify.difference)],
                                ]}
                            />
                        </div>
                    ) : null}

                    {Array.isArray(audit.checks) && audit.checks.length ? (
                        <div className="rounded-md border text-sm">
                            <div className="border-b bg-muted/40 px-3 py-2 font-medium">Chi tiết audit trace giá vốn</div>
                            <div className="divide-y">
                                {audit.checks.map((item: any) => (
                                    <div key={item.code} className="grid gap-2 px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                                        <div>
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-xs text-muted-foreground">{item.code}</div>
                                        </div>
                                        <div className={item.ok ? "text-emerald-700" : "text-red-700"}>{item.ok ? "Đúng" : "Còn lỗi"}</div>
                                        <div className="font-medium">{fmt(item.failed_rows)} lỗi</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {Array.isArray(check.errors) && check.errors.length ? (
                        <div className="max-h-56 overflow-auto rounded-md border text-sm">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="w-24 px-3 py-2 text-left">Dòng</th>
                                        <th className="px-3 py-2 text-left">Lỗi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {check.errors.map((error: any, index: number) => (
                                        <tr key={`${error.row}-${index}`} className="border-t">
                                            <td className="px-3 py-2">{error.row}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{error.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="border-t pt-3">
                    <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Đóng</Button>
                    {canRollback ? (
                        <Button variant="destructive" disabled={busy} onClick={() => runStep("rollback")}>
                            {stepMutation.isPending ? <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Rollback
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function NormalizationStep({
    title,
    description,
    done,
    disabled,
    buttonText,
    onClick,
}: {
    title: string
    description: string
    done: boolean
    disabled: boolean
    buttonText: string
    onClick: () => void
}) {
    return (
        <div className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
                <div className="flex items-center gap-2 font-medium">
                    {done ? <FileCheck2 className="h-4 w-4 text-emerald-600" /> : <PlayCircle className="h-4 w-4 text-muted-foreground" />}
                    {title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{description}</div>
            </div>
            <Button type="button" size="sm" variant={done ? "outline" : "default"} disabled={disabled} onClick={onClick}>
                {buttonText}
            </Button>
        </div>
    )
}

function NormInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/20 p-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-0.5 truncate font-medium">{value}</div>
        </div>
    )
}

function ResultBox({ title, note, items }: { title: string; note?: string; items: Array<[string, string]> }) {
    return (
        <div className="rounded-md border p-3">
            <div className="font-medium">{title}</div>
            {note ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{note}</div> : null}
            <div className="mt-2 space-y-1">
                {items.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function stepSuccessText(status: string) {
    switch (status) {
        case "CHECKED": return "Kiểm tra file hợp lệ"
        case "IMPACTED": return "Đã phân tích phạm vi ảnh hưởng"
        case "SNAPSHOT_CREATED": return "Đã tạo snapshot rollback"
        case "APPLIED": return "Đã cập nhật tồn đầu kỳ"
        case "DOWNSTREAM_NORMALIZED": return "Đã chuẩn hóa dữ liệu phát sinh mới"
        case "RECALC_MARKED": return "Đã đánh dấu kỳ cần tính lại"
        case "RECALCULATED": return "Đã tính lại costing"
        case "AUDITED": return "Audit trace giá vốn đạt"
        case "COMPLETED": return "Đối chiếu hoàn tất"
        case "ROLLED_BACK": return "Đã rollback về snapshot"
        default: return "Đã cập nhật bước"
    }
}

function fmt(value: unknown) {
    if (value === null || value === undefined || value === "") return "0"
    const num = Number(value)
    if (!Number.isFinite(num)) return String(value)
    return new Intl.NumberFormat("vi-VN").format(num)
}

function money(value: unknown) {
    if (value === null || value === undefined || value === "") return "0"
    const num = Number(value)
    if (!Number.isFinite(num)) return String(value)
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(num)
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
        optionalColumns: [
            "Tổng giá trị",
            "Đơn giá",
        ],
        notes: [
            "Hạn sử dụng và Ngày hạch toán bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.",
            "Dòng có Mã hàng bắt đầu bằng PHI hoặc dòng không có Mã kho sẽ được bỏ qua. Mã hàng khác nếu chưa có trong danh mục sản phẩm sẽ báo lỗi.",
            "Tổng giá trị và Đơn giá đều là cột tùy chọn. Nếu thiếu cả hai, hệ thống vẫn import dòng mua hàng và bỏ qua phần xử lý giá của dòng đó.",
            "Nếu file có cột Tổng giá trị, hệ thống ưu tiên lấy Tổng giá trị làm amount chuẩn và tính unit_price = Tổng giá trị / Số lượng thực nhập.",
            "Nếu không có Tổng giá trị nhưng có Đơn giá, hệ thống tính amount = Số lượng thực nhập * Đơn giá như trước.",
            "Khi dùng Tổng giá trị, đơn giá lưu vào sổ kho được hiểu là đơn giá đã bao gồm PLH để tổng giá trị khớp file.",
            "Import lại cùng file không tạo trùng giao dịch. Nếu dòng mua hàng đã tồn tại nhưng cần chỉnh Tổng giá trị/đơn giá, dùng nút Sửa đơn giá mua hàng.",
        ],
        inputRef,
    }
}

function purchaseBasePriceGuide(inputRef: RefObject<HTMLInputElement | null>): ImportGuide {
    return {
        title: "Sửa đơn giá mua hàng",
        description: "File này dùng để giữ Tổng giá trị mua hàng đúng theo hệ thống cũ; hệ thống tự tính lại đơn giá từ Tổng giá trị / Số lượng.",
        columns: PURCHASE_PRICE_REQUIRED_COLUMNS,
        notes: [
            "Cột Tên hàng chỉ để người dùng dễ kiểm tra file; hệ thống map dòng theo Mã hàng.",
            "Cột Tổng giá trị là số chuẩn cần khớp tuyệt đối. Hệ thống lưu amount theo cột này và tính unit_price = Tổng giá trị / Số lượng với phần thập phân cao.",
            "Nếu cùng ngày/mã hàng/kho/lô khớp nhưng Số chứng từ khác, hệ thống chỉ tự fallback khi tìm được đúng một nhóm DB; nếu có nhiều nhóm khớp sẽ báo lỗi.",
            "Nếu số dòng file và số dòng DB khác nhau nhưng tổng số lượng khớp, hệ thống đồng bộ lại dòng sổ kho theo file và đồng bộ chi tiết phiếu mua hàng nếu dòng có liên kết voucher.",
            "Nếu có lỗi ở bất kỳ dòng nào, toàn bộ file rollback và không cập nhật nửa chừng.",
            "Sau khi cập nhật, hệ thống tính lại inventory_lots.unit_cost theo tổng amount của các dòng mua hàng dương của lô đó.",
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
        description: "File này chỉ cập nhật Tổng giá trị và đơn giá tính ngược cho các dòng Sổ kho đã có, không tạo giao dịch mới.",
        columns: LEDGER_PRICE_IMPORT_REQUIRED_COLUMNS,
        notes: [
            "Chỉ xử lý các loại chứng từ: Hàng mua trả lại - Giảm trừ công nợ, Nhập kho khác, Nhập kho từ hàng bán trả lại, Xuất chuyển kho nội bộ, Xuất kho khác.",
            "Dòng nhập lấy số lượng ở cột Nhập; dòng xuất lấy số lượng ở cột Xuất. Riêng Xuất chuyển kho nội bộ có thể có cả dòng Nhập và dòng Xuất tương ứng.",
            "Cột Tổng giá trị trong file nhập là số dương. Với dòng xuất, hệ thống vẫn lưu amount âm trong DB nhưng trị tuyệt đối sẽ khớp đúng Tổng giá trị file.",
            "Ngày chứng từ bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy.",
            "Hệ thống tính unit_price = Tổng giá trị / Số lượng với phần thập phân cao và được phép ghi đè giá cũ khi dòng sổ kho match rõ ràng.",
            "Không cập nhật giá trong Tồn theo lô; chỉ cập nhật inventory_ledger và chi tiết phiếu nếu dòng sổ kho có liên kết phiếu. Nếu có lỗi ở bất kỳ dòng nào, toàn bộ file rollback.",
        ],
        inputRef,
    }
}

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
    await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
}
