import { useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Download, FolderOpen, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    downloadAdministrativeBoundaryFile,
    listAdministrativeBoundaryFiles,
    uploadAdministrativeBoundaryFile,
    type AdministrativeBoundaryFile,
} from "@/api/geography"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type View = "OLD" | "CURRENT"
type Scope = "all" | "province" | "overview" | "detail"
const MAX_FILE_BYTES = 25 * 1024 * 1024

function fileView(file: AdministrativeBoundaryFile): View {
    return file.file_name.startsWith("old_") ? "OLD" : "CURRENT"
}

function fileScope(file: AdministrativeBoundaryFile): Exclude<Scope, "all"> {
    if (file.file_name.endsWith("_provinces.geojson")) return "province"
    if (file.file_name.endsWith("_overview.geojson")) return "overview"
    return "detail"
}

function fileTitle(file: AdministrativeBoundaryFile) {
    const subject = fileView(file) === "OLD" ? "Huyện/Quận" : "Xã/Phường"
    switch (fileScope(file)) {
        case "province": return "Tỉnh/Thành phố · toàn quốc"
        case "overview": return `${subject} · tổng quan`
        case "detail": return `${subject} · ${file.province_name ?? `tỉnh ${file.file_name.match(/_(\d{2})\.geojson$/)?.[1] ?? ""}`}`
    }
}

function fileSize(bytes: number) {
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function BoundaryFilesButton({ canUpdate }: { canUpdate: boolean }) {
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<View>("CURRENT")
    const [scope, setScope] = useState<Scope>("all")
    const [selected, setSelected] = useState<File[]>([])
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
    const [expanded, setExpanded] = useState<string | null>(null)
    const filesQuery = useQuery({
        queryKey: ["administrative-boundary-files"],
        queryFn: listAdministrativeBoundaryFiles,
        enabled: open,
    })
    const visible = useMemo(() => (filesQuery.data ?? []).filter((file) =>
        fileView(file) === view && (scope === "all" || fileScope(file) === scope),
    ), [filesQuery.data, scope, view])

    const upload = async () => {
        if (!selected.length || progress) return
        const failed: string[] = []
        setProgress({ current: 0, total: selected.length })
        for (let i = 0; i < selected.length; i++) {
            if (selected[i].size > MAX_FILE_BYTES) {
                failed.push(`${selected[i].name}: File vượt quá 25 MB`)
                setProgress({ current: i + 1, total: selected.length })
                continue
            }
            try {
                await uploadAdministrativeBoundaryFile(selected[i])
            } catch (error) {
                failed.push(`${selected[i].name}: ${error instanceof Error ? error.message : "Không tải lên được"}`)
            }
            setProgress({ current: i + 1, total: selected.length })
        }
        await queryClient.invalidateQueries({ queryKey: ["administrative-boundary-files"] })
        setProgress(null)
        if (failed.length) {
            toast.error(`${failed.length} file không tải lên được`, { description: failed[0] })
            setSelected(selected.filter((file) => failed.some((item) => item.startsWith(`${file.name}:`))))
        } else {
            toast.success(`Đã tải lên ${selected.length} file GeoJSON`)
            setSelected([])
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    const download = async (file: AdministrativeBoundaryFile) => {
        try {
            const blob = await downloadAdministrativeBoundaryFile(file.file_name)
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = file.file_name
            link.click()
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không tải được file")
        }
    }

    return <>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <FolderOpen className="h-4 w-4" /> File ranh giới
        </Button>
        <Dialog open={open} onOpenChange={(next) => { if (!progress) setOpen(next) }}>
            <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>File ranh giới hành chính</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Tabs value={view} onValueChange={(value) => { setView(value as View); setExpanded(null) }}>
                            <TabsList>
                                <TabsTrigger value="CURRENT">Địa giới hiện tại</TabsTrigger>
                                <TabsTrigger value="OLD">Địa giới cũ</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <span className="text-sm text-muted-foreground">
                            {(filesQuery.data ?? []).filter((file) => fileView(file) === view).length}/{view === "OLD" ? 65 : 36} file
                        </span>
                    </div>
                    <Select value={scope} onValueChange={(value) => setScope(value as Scope)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả cấp</SelectItem>
                            <SelectItem value="province">Tỉnh/Thành phố</SelectItem>
                            <SelectItem value="overview">Tổng quan</SelectItem>
                            <SelectItem value="detail">Chi tiết theo tỉnh</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {filesQuery.isLoading ? <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang đọc file...</div>
                        : filesQuery.isError ? <div className="py-8 text-destructive">{filesQuery.error instanceof Error ? filesQuery.error.message : "Không đọc được danh sách file"}</div>
                        : visible.length === 0 ? <div className="py-8 text-center text-muted-foreground">Chưa có file cho góc nhìn này</div>
                        : <div className="divide-y">
                            {visible.map((file) => <div key={file.file_name}>
                                <div className="flex items-center gap-3 py-3">
                                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setExpanded(expanded === file.file_name ? null : file.file_name)}>
                                        {expanded === file.file_name ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                        <span className="truncate font-medium">{fileTitle(file)}</span>
                                    </button>
                                    <span className="w-20 shrink-0 text-right text-sm tabular-nums">{file.feature_count?.toLocaleString("vi-VN") ?? "–"} đơn vị</span>
                                    <span className="w-20 shrink-0 text-right text-sm text-muted-foreground">{fileSize(file.bytes)}</span>
                                    <span className="hidden w-24 shrink-0 text-right text-sm text-muted-foreground sm:block">{new Date(file.updated_at).toLocaleDateString("vi-VN")}</span>
                                    <Button type="button" variant="ghost" size="icon" title="Tải file GeoJSON" onClick={() => download(file)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                                {expanded === file.file_name && <div className="pb-4 pl-6 text-sm text-muted-foreground">
                                    <div className="font-mono text-xs">{file.file_name}</div>
                                    {file.sample_names?.length ? <div className="mt-1">{file.sample_names.join(", ")}{(file.feature_count ?? 0) > file.sample_names.length ? "…" : ""}</div> : null}
                                </div>}
                            </div>)}
                        </div>}
                </div>
                {canUpdate && <div className="space-y-3 border-t pt-4">
                    <Input ref={inputRef} type="file" multiple accept=".geojson,application/geo+json" disabled={!!progress}
                        onChange={(event) => setSelected(Array.from(event.target.files ?? []))} />
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>{selected.length ? `${selected.length} file đã chọn` : "Chọn các file GeoJSON trong bộ dữ liệu đã xuất"}</span>
                        <Button type="button" disabled={!selected.length || !!progress} onClick={upload}>
                            {progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {progress ? `${progress.current}/${progress.total}` : "Tải lên"}
                        </Button>
                    </div>
                </div>}
                <DialogFooter><Button type="button" variant="outline" disabled={!!progress} onClick={() => setOpen(false)}>Đóng</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </>
}
