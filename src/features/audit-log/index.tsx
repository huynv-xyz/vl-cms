import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Eye, Filter, RotateCcw } from "lucide-react"
import { getAuditLogOptions, searchAuditLogs, type AuditLog, type AuditLogFilters } from "@/api/audit-log"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const initialFilters: AuditLogFilters = { page: 1, size: 20 }

export default function AuditLogPage() {
    const [draft, setDraft] = useState<AuditLogFilters>(initialFilters)
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters)
    const [selected, setSelected] = useState<AuditLog | null>(null)

    const logs = useQuery({
        queryKey: ["audit-logs", filters],
        queryFn: () => searchAuditLogs(filters),
    })
    const options = useQuery({
        queryKey: ["audit-log-options"],
        queryFn: getAuditLogOptions,
    })

    const applyFilters = () => setFilters({ ...draft, page: 1, size: filters.size ?? 20 })
    const resetFilters = () => {
        setDraft(initialFilters)
        setFilters(initialFilters)
    }
    const goToPage = (page: number) => {
        setFilters((current) => ({ ...current, page }))
        setDraft((current) => ({ ...current, page }))
    }

    return (
        <div className="space-y-5 p-6">
            <div>
                <h1 className="text-2xl font-bold">Nhật ký hệ thống</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Truy vết thao tác tạo, sửa và xóa dữ liệu: ai thực hiện, lúc nào và giá trị thay đổi.
                </p>
            </div>

            <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterSelect
                    placeholder="Tất cả module"
                    value={draft.module}
                    options={options.data?.modules ?? []}
                    onChange={(module) => setDraft({ ...draft, module })}
                />
                <FilterSelect
                    placeholder="Tất cả loại dữ liệu"
                    value={draft.entity_type}
                    options={options.data?.entity_types ?? []}
                    onChange={(entity_type) => setDraft({ ...draft, entity_type })}
                />
                <Select value={draft.action || "ALL"} onValueChange={(value) => setDraft({ ...draft, action: value === "ALL" ? undefined : value })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả hành động</SelectItem>
                        <SelectItem value="CREATE">Tạo mới</SelectItem>
                        <SelectItem value="UPDATE">Cập nhật</SelectItem>
                        <SelectItem value="DELETE">Xóa</SelectItem>
                        <SelectItem value="EXECUTE">Thực thi nghiệp vụ</SelectItem>
                    </SelectContent>
                </Select>
                <Input placeholder="Mã bản ghi" value={draft.entity_id ?? ""} onChange={(event) => setDraft({ ...draft, entity_id: event.target.value })} />
                <Input placeholder="ID người thao tác" inputMode="numeric" value={draft.changed_by ?? ""} onChange={(event) => setDraft({ ...draft, changed_by: event.target.value })} />
                <Input type="date" aria-label="Từ ngày" value={draft.from_date ?? ""} onChange={(event) => setDraft({ ...draft, from_date: event.target.value })} />
                <Input type="date" aria-label="Đến ngày" value={draft.to_date ?? ""} onChange={(event) => setDraft({ ...draft, to_date: event.target.value })} />
                <Input
                    placeholder="Tìm module, dữ liệu, người sửa..."
                    value={draft.keyword ?? ""}
                    onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
                    onKeyDown={(event) => event.key === "Enter" && applyFilters()}
                />
                <div className="flex gap-2 md:col-span-2 xl:col-span-4">
                    <Button onClick={applyFilters}><Filter className="mr-2 h-4 w-4" />Lọc dữ liệu</Button>
                    <Button variant="outline" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" />Đặt lại</Button>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Thời điểm</TableHead>
                            <TableHead>Người thao tác</TableHead>
                            <TableHead>Module</TableHead>
                            <TableHead>Dữ liệu</TableHead>
                            <TableHead>Hành động</TableHead>
                            <TableHead>Trường thay đổi</TableHead>
                            <TableHead className="w-16" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(logs.data?.items ?? []).map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap">{formatDateTime(log.changed_at)}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{log.changed_by_name}</div>
                                    <div className="text-xs text-muted-foreground">ID: {log.changed_by}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{log.module}</Badge></TableCell>
                                <TableCell>
                                    <div>{humanize(log.entity_type)}</div>
                                    <div className="text-xs text-muted-foreground">#{log.entity_id}</div>
                                </TableCell>
                                <TableCell><ActionBadge action={log.action} /></TableCell>
                                <TableCell className="max-w-72">
                                    <div className="line-clamp-2 text-sm">{parseFields(log.changed_fields).map(humanize).join(", ") || "—"}</div>
                                </TableCell>
                                <TableCell><Button size="icon" variant="ghost" onClick={() => setSelected(log)} title="Xem chi tiết"><Eye className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                        ))}
                        {!logs.isLoading && (logs.data?.items ?? []).length === 0 && (
                            <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Không có nhật ký phù hợp bộ lọc.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng {logs.data?.total ?? 0} bản ghi</span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={(filters.page ?? 1) <= 1 || logs.isFetching} onClick={() => goToPage((filters.page ?? 1) - 1)}>Trước</Button>
                    <span>Trang {logs.data?.current_page ?? 1} / {Math.max(1, logs.data?.total_page ?? 1)}</span>
                    <Button variant="outline" size="sm" disabled={(filters.page ?? 1) >= (logs.data?.total_page ?? 0) || logs.isFetching} onClick={() => goToPage((filters.page ?? 1) + 1)}>Sau</Button>
                </div>
            </div>

            <AuditDetailDialog log={selected} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    )
}

function FilterSelect({ placeholder, value, options, onChange }: { placeholder: string; value?: string; options: string[]; onChange: (value?: string) => void }) {
    return (
        <Select value={value || "ALL"} onValueChange={(next) => onChange(next === "ALL" ? undefined : next)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">{placeholder}</SelectItem>
                {options.map((option) => <SelectItem key={option} value={option}>{humanize(option)}</SelectItem>)}
            </SelectContent>
        </Select>
    )
}

function AuditDetailDialog({ log, onOpenChange }: { log: AuditLog | null; onOpenChange: (open: boolean) => void }) {
    const oldValues = useMemo(() => parseObject(log?.old_values), [log])
    const newValues = useMemo(() => parseObject(log?.new_values), [log])
    const changedFields = useMemo(() => new Set(parseFields(log?.changed_fields)), [log])
    const fields = useMemo(() => {
        const allFields = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]))
        return allFields.sort((left, right) => {
            const leftChanged = changedFields.has(left) ? 0 : 1
            const rightChanged = changedFields.has(right) ? 0 : 1
            return leftChanged - rightChanged || left.localeCompare(right)
        })
    }, [oldValues, newValues, changedFields])
    return (
        <Dialog open={!!log} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-4xl overflow-auto">
                <DialogHeader>
                    <DialogTitle>Chi tiết nhật ký #{log?.id}</DialogTitle>
                    <DialogDescription>{log ? `${log.changed_by_name} · ${formatDateTime(log.changed_at)} · ${log.entity_type} #${log.entity_id}` : ""}</DialogDescription>
                </DialogHeader>
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader><TableRow><TableHead>Trường</TableHead><TableHead>Giá trị cũ</TableHead><TableHead>Giá trị mới</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {fields.map((field) => (
                                <TableRow key={field} className={changedFields.has(field) ? "bg-amber-50/70" : undefined}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {humanize(field)}
                                            {changedFields.has(field) && <Badge className="bg-amber-100 text-amber-700">Đã đổi</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-80 break-all text-muted-foreground">{displayValue(oldValues[field])}</TableCell>
                                    <TableCell className="max-w-80 break-all">{displayValue(newValues[field])}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ActionBadge({ action }: { action: string }) {
    const className = action === "CREATE" ? "bg-emerald-100 text-emerald-700" : action === "DELETE" ? "bg-red-100 text-red-700" : action === "EXECUTE" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
    const label = action === "CREATE" ? "Tạo mới" : action === "DELETE" ? "Xóa" : action === "EXECUTE" ? "Thực thi" : "Cập nhật"
    return <Badge className={className}>{label}</Badge>
}

function parseObject(value?: Record<string, unknown> | string) {
    if (!value) return {} as Record<string, unknown>
    if (typeof value !== "string") return value
    try { return JSON.parse(value) as Record<string, unknown> } catch { return {} }
}

function parseFields(value?: string[] | string) {
    if (!value) return []
    if (Array.isArray(value)) return value
    try { return JSON.parse(value) as string[] } catch { return [] }
}

function displayValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "—"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
}

function humanize(value: string) {
    return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDateTime(value: string) {
    const normalized = value?.includes("T") ? value : value?.replace(" ", "T")
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN")
}
