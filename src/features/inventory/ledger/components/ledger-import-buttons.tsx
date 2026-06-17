import { useRef, type ChangeEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { importOpeningStock, importPurchaseStock, importVthhDetail } from "@/api/inventory/lot"
import { Button } from "@/components/ui/button"

const OPENING_STOCK_REQUIRED_COLUMNS = [
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Mã kho",
    "Tên kho",
    "Mã lô",
    "Số lượng",
    "ĐVT",
    "Đơn giá",
    "HSD",
]

const PURCHASE_STOCK_REQUIRED_COLUMNS = [
    "Số chứng từ",
    "Ngày nhập",
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Mã kho",
    "Tên kho",
    "Mã lô",
    "Số lượng",
    "ĐVT",
    "Đơn giá",
    "Chi phí mua",
    "Thành tiền",
    "HSD",
]

const VTHH_DETAIL_REQUIRED_COLUMNS = [
    "Loại chứng từ",
    "Số chứng từ",
    "Ngày chứng từ",
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Mã kho",
    "Tên kho",
    "Mã lô",
    "Nhập",
    "Xuất",
    "ĐVT",
    "HSD",
]

export function LedgerImportButtons() {
    const queryClient = useQueryClient()
    const openingFileRef = useRef<HTMLInputElement>(null)
    const purchaseFileRef = useRef<HTMLInputElement>(null)
    const vthhDetailFileRef = useRef<HTMLInputElement>(null)

    const importOpeningMutation = useMutation({
        mutationFn: importOpeningStock,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)

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

            if (res.failed > 0) {
                toast.warning(`Import mua hàng xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }

            toast.success(`Đã import ${res.success} dòng mua hàng`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import mua hàng"),
    })

    const importVthhDetailMutation = useMutation({
        mutationFn: importVthhDetail,
        onSuccess: async (res) => {
            await invalidateInventoryQueries(queryClient)

            if (res.failed > 0) {
                toast.warning(`Import chi tiết VTHH xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }

            toast.success(`Đã import ${res.success} dòng chi tiết VTHH`)
        },
        onError: (error: any) => toast.error(error?.message || "Không thể import chi tiết VTHH"),
    })

    const handleOpeningFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        importOpeningMutation.mutate(file)
    }

    const handlePurchaseFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        importPurchaseMutation.mutate(file)
    }

    const handleVthhDetailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        importVthhDetailMutation.mutate(file)
    }

    const openOpeningFilePicker = () => {
        const accepted = window.confirm(
            [
                "File import tồn đầu kỳ cần có đủ các cột:",
                "",
                ...OPENING_STOCK_REQUIRED_COLUMNS.map((column) => `- ${column}`),
                "",
                "HSD có thể nhập nhiều định dạng ngày thông dụng, ví dụ 2026-06-30 hoặc 30/06/2026.",
            ].join("\n")
        )

        if (accepted) {
            openingFileRef.current?.click()
        }
    }

    const openPurchaseFilePicker = () => {
        const accepted = window.confirm(
            [
                "File import mua hàng cần có đủ các cột:",
                "",
                ...PURCHASE_STOCK_REQUIRED_COLUMNS.map((column) => `- ${column}`),
                "",
                "HSD và Ngày nhập có thể nhập nhiều định dạng ngày thông dụng, ví dụ 2026-06-30 hoặc 30/06/2026.",
            ].join("\n")
        )

        if (accepted) {
            purchaseFileRef.current?.click()
        }
    }

    const openVthhDetailFilePicker = () => {
        const accepted = window.confirm(
            [
                "File import chi tiết VTHH cần có đủ các cột:",
                "",
                ...VTHH_DETAIL_REQUIRED_COLUMNS.map((column) => `- ${column}`),
                "",
                "Loại chứng từ nhập đúng tên tiếng Việt, ví dụ: Nhập kho khác, Xuất kho khác, Xuất kho sản xuất.",
                "Ngày chứng từ và HSD có thể nhập nhiều định dạng ngày thông dụng, ví dụ 2026-06-30 hoặc 30/06/2026.",
            ].join("\n")
        )

        if (accepted) {
            vthhDetailFileRef.current?.click()
        }
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
        </>
    )
}

async function invalidateInventoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
    await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
    await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
}
