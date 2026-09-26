import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { importAdministrativeUnitsExcel } from "@/api/geography"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const REQUIRED_COLUMNS = [
    "Mã Tỉnh/Thành phố cũ",
    "Tỉnh/Thành phố cũ",
    "Mã Huyện/Quận cũ",
    "Huyện/Quận cũ",
    "Mã Xã/Phường cũ",
    "Xã/Phường cũ",
    "Mã Tỉnh/Thành phố hiện tại",
    "Tỉnh/Thành phố hiện tại",
    "Mã Xã/Phường hiện tại",
    "Xã/Phường hiện tại",
]

export function ImportAdministrativeUnitsButton() {
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const close = () => {
        if (loading) return
        setOpen(false)
        setFile(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    const submit = async () => {
        if (!file) return
        try {
            setLoading(true)
            const result = await importAdministrativeUnitsExcel(file)
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["administrative-unit-mappings"] }),
                queryClient.invalidateQueries({ queryKey: ["administrative-unit"] }),
                queryClient.invalidateQueries({ queryKey: ["administrative-unit-summary"] }),
            ])
            toast.success(
                `Đã import ${result.rows} dòng: ${result.created_mappings} ánh xạ mới, ${result.updated_mappings} ánh xạ cập nhật`,
            )
            closeAfterSuccess()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Import địa giới hành chính thất bại")
        } finally {
            setLoading(false)
        }
    }

    const closeAfterSuccess = () => {
        setOpen(false)
        setFile(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    return <>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <Upload className="h-4 w-4" />
            Import Excel
        </Button>
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Import địa giới hành chính</DialogTitle>
                    <DialogDescription>
                        Dòng đầu tiên của sheet phải có đủ các tên cột bên dưới. Mỗi dòng dữ liệu là một ánh xạ cũ - hiện tại.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-1">
                    <div>
                        <Label className="mb-2 block">Tên cột bắt buộc</Label>
                        <div className="divide-y rounded-md border bg-muted/20">
                            {REQUIRED_COLUMNS.map((column, index) => (
                                <div key={column} className="flex items-center gap-3 px-3 py-2 text-sm">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-background font-medium text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <span>{column}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="administrative-unit-import" className="mb-2 block">File Excel (.xlsx)</Label>
                        <Input
                            ref={inputRef}
                            id="administrative-unit-import"
                            type="file"
                            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            disabled={loading}
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                        />
                        {file && <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="truncate">{file.name}</span>
                        </div>}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close} disabled={loading}>Hủy</Button>
                    <Button type="button" onClick={submit} disabled={!file || loading}>
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? "Đang import..." : "Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
}
