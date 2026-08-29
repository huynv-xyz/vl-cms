import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Activity, AlertCircle, ArrowRight, Check, ChevronsUpDown, Clock3, Eye, Filter, Info, RotateCcw, Search, Shield, X, XCircle } from "lucide-react"
import { getAuditLogOptions, searchAuditLogs, type AuditLog, type AuditLogFilters, type AuditLogOption } from "@/api/audit-log"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const initialFilters: AuditLogFilters = { page: 1, size: 25 }
const riskyActions = new Set(["DELETE", "UPDATE_PERMISSIONS", "ADJUST_PRICE", "ADJUST_QUANTITY", "LOCK", "UNLOCK"])
const fallbackSourceTypes = ["USER", "FALLBACK", "IMPORT", "JOB", "SYSTEM"]
const fallbackResultStatuses = ["SUCCESS", "FAILED", "DENIED"]
type FilterKey = Exclude<keyof AuditLogFilters, "page" | "size">
type FilterValueLabelers = Partial<Record<FilterKey, (value: string) => string>>

export default function AuditLogPage() {
    const [draft, setDraft] = useState<AuditLogFilters>(initialFilters)
    const [filters, setFilters] = useState<AuditLogFilters>(initialFilters)
    const [selected, setSelected] = useState<AuditLog | null>(null)

    const logs = useQuery({
        queryKey: ["audit-logs", filters],
        queryFn: () => searchAuditLogs(filters),
    })
    const optionFilters = useMemo(() => cleanFilters({
        module: draft.module,
        entity_type: draft.entity_type,
        action: draft.action,
        source_type: draft.source_type,
        result_status: draft.result_status,
        changed_by: draft.changed_by,
        from_date: draft.from_date,
        to_date: draft.to_date,
    }), [draft.action, draft.changed_by, draft.entity_type, draft.from_date, draft.module, draft.result_status, draft.source_type, draft.to_date])
    const options = useQuery({
        queryKey: ["audit-log-options", optionFilters],
        queryFn: () => getAuditLogOptions(optionFilters),
    })

    const items = logs.data?.items ?? []
    const metrics = useMemo(() => buildMetrics(items), [items])
    const moduleOptions = useMemo(() => optionValues(options.data?.modules), [options.data?.modules])
    const moduleLabels = useMemo(() => optionLabelMap(options.data?.modules), [options.data?.modules])
    const entityTypeOptions = useMemo(() => optionValues(options.data?.entity_types), [options.data?.entity_types])
    const entityTypeLabels = useMemo(() => optionLabelMap(options.data?.entity_types), [options.data?.entity_types])
    const actionSelectOptions = useMemo(() => optionValues(options.data?.actions, actionOptions), [options.data?.actions])
    const actionLabels = useMemo(() => optionLabelMap(options.data?.actions), [options.data?.actions])
    const sourceTypeOptions = useMemo(() => optionValues(options.data?.source_types, fallbackSourceTypes), [options.data?.source_types])
    const sourceTypeLabels = useMemo(() => optionLabelMap(options.data?.source_types), [options.data?.source_types])
    const resultStatusOptions = useMemo(() => optionValues(options.data?.result_statuses, fallbackResultStatuses), [options.data?.result_statuses])
    const resultStatusLabels = useMemo(() => optionLabelMap(options.data?.result_statuses), [options.data?.result_statuses])
    const changedUserOptions = useMemo(() => {
        const values = (options.data?.changed_users ?? []).map((user) => String(user.id))
        if (draft.changed_by && !values.includes(draft.changed_by)) return [draft.changed_by, ...values]
        return values
    }, [draft.changed_by, options.data?.changed_users])
    const changedUserLabels = useMemo(() => new Map((options.data?.changed_users ?? []).map((user) => [String(user.id), `${user.name} · ID ${user.id}`])), [options.data?.changed_users])
    const labelers = useMemo(() => ({
        module: (value: string) => moduleLabels.get(value) ?? humanize(value),
        entity_type: (value: string) => entityTypeLabels.get(normalizeEntityType(value)) ?? entityTypeLabel(value),
        action: (value: string) => actionLabels.get(value) ?? actionLabel(value),
        source_type: (value: string) => sourceTypeLabels.get(value) ?? sourceLabel(value),
        result_status: (value: string) => resultStatusLabels.get(value) ?? resultLabel(value),
        changed_by: (value: string) => changedUserLabels.get(value) ?? `ID ${value}`,
    }), [actionLabels, changedUserLabels, entityTypeLabels, moduleLabels, resultStatusLabels, sourceTypeLabels])
    const activeChips = useMemo(() => buildActiveChips(filters, labelers), [filters, labelers])
    const activeFilterCount = activeChips.length
    const hasDraftChanges = filterKey(draft) !== filterKey(filters)

    useEffect(() => {
        if (!options.data) return
        const next = { ...draft }
        if (next.module && moduleOptions.length && !moduleOptions.includes(next.module)) next.module = undefined
        if (next.entity_type && entityTypeOptions.length && !entityTypeOptions.includes(next.entity_type)) next.entity_type = undefined
        if (next.action && actionSelectOptions.length && !actionSelectOptions.includes(next.action)) next.action = undefined
        if (next.source_type && sourceTypeOptions.length && !sourceTypeOptions.includes(next.source_type)) next.source_type = undefined
        if (next.result_status && resultStatusOptions.length && !resultStatusOptions.includes(next.result_status)) next.result_status = undefined
        if (filterKey(next) !== filterKey(draft)) setDraft(cleanFilters(next))
    }, [actionSelectOptions, changedUserOptions, draft, entityTypeOptions, moduleOptions, options.data, resultStatusOptions, sourceTypeOptions])

    const applyFilters = () => {
        const next = cleanFilters({ ...draft, page: 1, size: filters.size ?? 25 })
        setDraft(next)
        setFilters(next)
    }
    const resetFilters = () => {
        setDraft(initialFilters)
        setFilters(initialFilters)
    }
    const goToPage = (page: number) => {
        setFilters((current) => ({ ...current, page }))
        setDraft((current) => ({ ...current, page }))
    }
    const toggleFilter = (key: FilterKey, value: string) => {
        const next = cleanFilters({ ...filters, [key]: filters[key] === value ? undefined : value, page: 1 })
        setDraft(next)
        setFilters(next)
    }
    const applyDatePreset = (days: number) => {
        const fromDate = dateInput(days - 1)
        const toDate = dateInput(0)
        const active = filters.from_date === fromDate && filters.to_date === toDate
        const next = cleanFilters({ ...filters, from_date: active ? undefined : fromDate, to_date: active ? undefined : toDate, page: 1 })
        setDraft(next)
        setFilters(next)
    }
    const removeFilter = (key: FilterKey) => {
        const next = cleanFilters({ ...filters, [key]: undefined, page: 1 })
        setDraft(next)
        setFilters(next)
    }
    const changePageSize = (size: string) => {
        const next = cleanFilters({ ...filters, size: Number(size), page: 1 })
        setDraft(next)
        setFilters(next)
    }

    return (
        <div className="space-y-5 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-sky-700" />
                        <h1 className="text-2xl font-bold tracking-normal">Nhật ký hệ thống</h1>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                        Tra cứu thao tác quản trị theo người dùng, đối tượng, hành động, request và giá trị thay đổi.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <QuickButton active={filters.source_type === "FALLBACK"} onClick={() => toggleFilter("source_type", "FALLBACK")}>Audit yếu</QuickButton>
                    <QuickButton active={filters.action === "DELETE"} onClick={() => toggleFilter("action", "DELETE")}>Xóa dữ liệu</QuickButton>
                    <QuickButton active={filters.result_status === "FAILED"} onClick={() => toggleFilter("result_status", "FAILED")}>Thất bại</QuickButton>
                    <QuickButton active={filters.module === "access"} onClick={() => toggleFilter("module", "access")}>Quyền truy cập</QuickButton>
                    <QuickButton active={filters.action === "LOGIN_FAILED"} onClick={() => toggleFilter("action", "LOGIN_FAILED")}>Login lỗi</QuickButton>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Activity} label="Bản ghi đang xem" value={String(items.length)} hint={`Tổng khớp bộ lọc: ${logs.data?.total ?? 0}`} />
                <MetricCard icon={AlertCircle} label="Audit yếu" value={String(metrics.fallback)} hint="Chỉ ghi request, cần nâng cấp nếu quan trọng" tone="warn" />
                <MetricCard icon={XCircle} label="Thất bại/từ chối" value={String(metrics.failed)} hint="FAILED hoặc DENIED" tone="bad" />
                <MetricCard icon={Clock3} label="Rủi ro cao" value={String(metrics.risky)} hint="Xóa, đổi quyền, điều chỉnh nhạy cảm" />
            </div>

            <div className="rounded-lg border bg-card p-4">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <Filter className="h-4 w-4" />
                        Bộ lọc tra cứu
                        {activeFilterCount > 0 && <Badge variant="outline">{activeFilterCount} điều kiện</Badge>}
                        {options.isFetching && <Badge variant="outline">Đang cập nhật lựa chọn</Badge>}
                        {hasDraftChanges && <Badge className="bg-amber-100 text-amber-700">Chưa áp dụng</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <QuickButton active={filters.from_date === dateInput(0) && filters.to_date === dateInput(0)} onClick={() => applyDatePreset(1)}>Hôm nay</QuickButton>
                        <QuickButton active={filters.from_date === dateInput(6) && filters.to_date === dateInput(0)} onClick={() => applyDatePreset(7)}>7 ngày</QuickButton>
                        <QuickButton active={filters.from_date === dateInput(29) && filters.to_date === dateInput(0)} onClick={() => applyDatePreset(30)}>30 ngày</QuickButton>
                        <Button variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" />Đặt lại</Button>
                    </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
                    <FilterField label="Module">
                        <SearchableFilterSelect
                            placeholder="Tất cả module"
                            searchPlaceholder="Tìm module..."
                            value={draft.module}
                            options={moduleOptions}
                            onChange={(module) => setDraft(cleanFilters({ ...draft, module, entity_type: undefined, action: undefined, page: 1 }))}
                            formatOption={labelers.module}
                        />
                    </FilterField>
                    <FilterArrow />
                    <FilterField label="Đối tượng">
                        <SearchableFilterSelect
                            placeholder={draft.module ? "Tất cả đối tượng trong module" : "Tất cả đối tượng"}
                            searchPlaceholder="Tìm đối tượng..."
                            value={draft.entity_type}
                            options={entityTypeOptions}
                            onChange={(entity_type) => setDraft(cleanFilters({ ...draft, entity_type, action: undefined, page: 1 }))}
                            formatOption={labelers.entity_type}
                        />
                    </FilterField>
                    <FilterArrow />
                    <FilterField label="Hành động">
                        <FilterSelect
                            placeholder={draft.entity_type ? "Tất cả hành động của đối tượng" : "Tất cả hành động"}
                            value={draft.action}
                            options={actionSelectOptions}
                            onChange={(action) => setDraft(cleanFilters({ ...draft, action, page: 1 }))}
                            formatOption={labelers.action}
                        />
                    </FilterField>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-12">
                    <FilterField label="Từ khóa" className="md:col-span-2 xl:col-span-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="User, request id, endpoint, tóm tắt..."
                                value={draft.keyword ?? ""}
                                onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
                                onKeyDown={(event) => event.key === "Enter" && applyFilters()}
                            />
                        </div>
                    </FilterField>
                    <FilterField label="Kết quả" className="xl:col-span-2">
                        <FilterSelect
                            placeholder="Tất cả kết quả"
                            value={draft.result_status}
                            options={resultStatusOptions}
                            onChange={(result_status) => setDraft(cleanFilters({ ...draft, result_status, page: 1 }))}
                            formatOption={labelers.result_status}
                        />
                    </FilterField>
                    <FilterField label="Nguồn" className="xl:col-span-2">
                        <FilterSelect
                            placeholder="Tất cả nguồn"
                            value={draft.source_type}
                            options={sourceTypeOptions}
                            onChange={(source_type) => setDraft(cleanFilters({ ...draft, source_type, page: 1 }))}
                            formatOption={labelers.source_type}
                        />
                    </FilterField>
                    <FilterField label="Người thao tác" className="xl:col-span-2">
                        {changedUserOptions.length > 0 ? (
                            <SearchableFilterSelect
                                placeholder="Tất cả người"
                                searchPlaceholder="Tìm người hoặc ID..."
                                value={draft.changed_by}
                                options={changedUserOptions}
                                onChange={(changed_by) => setDraft(cleanFilters({ ...draft, changed_by, page: 1 }))}
                                formatOption={labelers.changed_by}
                            />
                        ) : (
                            <Input placeholder="ID người thao tác" inputMode="numeric" value={draft.changed_by ?? ""} onChange={(event) => setDraft({ ...draft, changed_by: event.target.value })} />
                        )}
                    </FilterField>
                    <FilterField label="Mã bản ghi" className="xl:col-span-2">
                        <Input placeholder="VD: 1016" value={draft.entity_id ?? ""} onChange={(event) => setDraft({ ...draft, entity_id: event.target.value })} />
                    </FilterField>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(160px,0.75fr)]">
                    <FilterField label="Từ ngày">
                        <Input type="date" aria-label="Từ ngày" value={draft.from_date ?? ""} onChange={(event) => setDraft(cleanFilters({ ...draft, from_date: event.target.value, page: 1 }))} />
                    </FilterField>
                    <FilterField label="Đến ngày">
                        <Input type="date" aria-label="Đến ngày" value={draft.to_date ?? ""} onChange={(event) => setDraft(cleanFilters({ ...draft, to_date: event.target.value, page: 1 }))} />
                    </FilterField>
                    <Button className="md:col-span-2 xl:col-span-1 xl:self-end" onClick={applyFilters} disabled={logs.isFetching || !hasDraftChanges}>
                        <Filter className="mr-2 h-4 w-4" />Áp dụng
                    </Button>
                </div>
                {activeChips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                        {activeChips.map((chip) => (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={() => removeFilter(chip.key)}
                                className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-xs text-foreground hover:bg-muted"
                                title="Bỏ điều kiện này"
                            >
                                <span className="truncate">{chip.label}</span>
                                <X className="h-3.5 w-3.5 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-lg border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-36">Thời điểm</TableHead>
                            <TableHead className="w-48">Người thao tác</TableHead>
                            <TableHead className="w-40">Thao tác</TableHead>
                            <TableHead>Dữ liệu</TableHead>
                            <TableHead>Diễn giải</TableHead>
                            <TableHead className="w-16" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.isLoading && Array.from({ length: 6 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                        ))}
                        {!logs.isLoading && items.map((log) => {
                            const changedFields = parseFields(log.changed_fields)
                            const subject = buildSubject(log, labelers)
                            const metadata = buildRequestMetadata(log)
                            return (
                                <TableRow key={log.id} className={cn(riskyActions.has(log.action) && "bg-amber-50/50", isFallback(log) && "bg-red-50/40")}>
                                    <TableCell className="align-top">
                                        <div className="whitespace-nowrap text-sm font-medium">{formatDate(log.changed_at)}</div>
                                        <div className="text-xs text-muted-foreground">{formatTime(log.changed_at)}</div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="font-medium">{log.changed_by_name || "System"}</div>
                                        <div className="text-xs text-muted-foreground">{log.changed_by ? `ID: ${log.changed_by}` : "Tự động hệ thống"}</div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="flex flex-col items-start gap-1">
                                            <ActionBadge action={log.action} />
                                            <ResultBadge status={log.result_status} />
                                            <SourceBadge source={log.source_type} />
                                            {isFallback(log) && <Badge className="bg-red-100 text-red-700">Audit yếu</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="min-w-64 align-top">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <Badge variant="outline">{subject.module}</Badge>
                                            <span className="text-sm font-medium">{subject.entity}</span>
                                        </div>
                                        <div className="mt-1 line-clamp-1 text-sm">{subject.title}</div>
                                        <div className="text-xs text-muted-foreground">ID: {log.entity_id}</div>
                                    </TableCell>
                                    <TableCell className="max-w-2xl align-top">
                                        <div className="line-clamp-2 text-sm">{buildAuditSummary(log, changedFields)}</div>
                                        {changedFields.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {changedFields.slice(0, 3).map((field) => (
                                                    <Badge key={field} variant="outline" className="max-w-40 truncate rounded-md font-normal">{humanize(field)}</Badge>
                                                ))}
                                                {changedFields.length > 3 && <Badge variant="outline" className="rounded-md font-normal">+{changedFields.length - 3} trường</Badge>}
                                            </div>
                                        )}
                                        <div className="mt-1 truncate text-xs text-muted-foreground">{metadata || "Không có metadata request"}</div>
                                    </TableCell>
                                    <TableCell className="align-top"><Button size="icon" variant="ghost" onClick={() => setSelected(log)} title="Xem chi tiết"><Eye className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            )
                        })}
                        {!logs.isLoading && items.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Không có nhật ký phù hợp bộ lọc.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-muted-foreground">Tổng {logs.data?.total ?? 0} bản ghi</span>
                    <Select value={String(filters.size ?? 25)} onValueChange={changePageSize}>
                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="25">25 dòng</SelectItem>
                            <SelectItem value="50">50 dòng</SelectItem>
                            <SelectItem value="100">100 dòng</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={(filters.page ?? 1) <= 1 || logs.isFetching} onClick={() => goToPage((filters.page ?? 1) - 1)}>Trước</Button>
                    <span>Trang {logs.data?.current_page ?? 1} / {Math.max(1, logs.data?.total_page ?? 1)}</span>
                    <Button variant="outline" size="sm" disabled={(filters.page ?? 1) >= (logs.data?.total_page ?? 0) || logs.isFetching} onClick={() => goToPage((filters.page ?? 1) + 1)}>Sau</Button>
                </div>
            </div>

            <AuditDetailSheet log={selected} labelers={labelers} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    )
}

function QuickButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick}>{children}</Button>
}

function MetricCard({ icon: Icon, label, value, hint, tone }: { icon: typeof Activity; label: string; value: string; hint: string; tone?: "warn" | "bad" }) {
    return (
        <Card className="rounded-lg py-4 shadow-none">
            <CardContent className="flex items-center gap-3 px-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700", tone === "warn" && "bg-amber-50 text-amber-700", tone === "bad" && "bg-red-50 text-red-700")}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="truncate text-xl font-semibold">{value}</div>
                    <div className="truncate text-xs text-muted-foreground">{hint}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function SearchableFilterSelect({
    placeholder,
    searchPlaceholder,
    value,
    options,
    onChange,
    formatOption = humanize,
}: {
    placeholder: string
    searchPlaceholder: string
    value?: string
    options: string[]
    onChange: (value?: string) => void
    formatOption?: (value: string) => string
}) {
    const [open, setOpen] = useState(false)
    const selectedLabel = value ? formatOption(value) : placeholder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("h-9 w-full justify-between px-3 font-normal", !value && "text-muted-foreground")}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList className="max-h-80">
                        <CommandEmpty>Không có dữ liệu phù hợp</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value={`__all__ ${placeholder}`}
                                onSelect={() => {
                                    onChange(undefined)
                                    setOpen(false)
                                }}
                            >
                                <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                                <span>{placeholder}</span>
                            </CommandItem>
                            {options.map((option) => {
                                const label = formatOption(option)
                                return (
                                    <CommandItem
                                        key={option}
                                        value={`${label} ${option}`}
                                        onSelect={() => {
                                            onChange(option)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check className={cn("h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">{label}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function FilterSelect({ placeholder, value, options, onChange, formatOption = humanize }: { placeholder: string; value?: string; options: string[]; onChange: (value?: string) => void; formatOption?: (value: string) => string }) {
    return (
        <Select value={value || "ALL"} onValueChange={(next) => onChange(next === "ALL" ? undefined : next)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
                <SelectItem value="ALL">{placeholder}</SelectItem>
                {options.map((option) => <SelectItem key={option} value={option}>{formatOption(option)}</SelectItem>)}
            </SelectContent>
        </Select>
    )
}

function FilterField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("min-w-0 space-y-1.5", className)}>
            <FieldLabel>{label}</FieldLabel>
            {children}
        </div>
    )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <div className="text-xs font-medium text-muted-foreground">{children}</div>
}

function FilterArrow() {
    return (
        <div className="hidden h-10 items-center justify-center pb-0.5 text-muted-foreground lg:flex">
            <ArrowRight className="h-4 w-4" />
        </div>
    )
}

function AuditDetailSheet({ log, labelers, onOpenChange }: { log: AuditLog | null; labelers: FilterValueLabelers; onOpenChange: (open: boolean) => void }) {
    const oldValues = useMemo(() => parseObject(log?.old_values), [log])
    const newValues = useMemo(() => parseObject(log?.new_values), [log])
    const changedFields = useMemo(() => new Set(parseFields(log?.changed_fields)), [log])
    const subject = useMemo(() => log ? buildSubject(log, labelers) : null, [labelers, log])
    const fields = useMemo(() => {
        const allFields = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]))
        return allFields.sort((left, right) => {
            const leftChanged = changedFields.has(left) ? 0 : 1
            const rightChanged = changedFields.has(right) ? 0 : 1
            return leftChanged - rightChanged || left.localeCompare(right)
        })
    }, [oldValues, newValues, changedFields])

    return (
        <Sheet open={!!log} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-auto p-0 sm:max-w-3xl">
                <SheetHeader className="border-b p-5 pr-12">
                    <SheetTitle>Nhật ký #{log?.id}</SheetTitle>
                    <SheetDescription>{log && subject ? `${log.changed_by_name || "System"} · ${formatDateTime(log.changed_at)} · ${subject.entity} #${log.entity_id}` : ""}</SheetDescription>
                </SheetHeader>
                {log && (
                    <div className="space-y-5 p-5">
                        <div className="grid gap-3 md:grid-cols-2">
                            <InfoBlock label="Hành động" value={<div className="flex flex-wrap gap-2"><ActionBadge action={log.action} /><ResultBadge status={log.result_status} /><SourceBadge source={log.source_type} /></div>} />
                            <InfoBlock label="Đối tượng" value={`${subject?.module} / ${subject?.entity} / ${subject?.title}`} />
                            <InfoBlock label="Người thao tác" value={`${log.changed_by_name || "System"}${log.changed_by ? ` (ID ${log.changed_by})` : ""}`} />
                            <InfoBlock label="Request" value={[log.request_method, log.request_path].filter(Boolean).join(" ") || "—"} />
                            <InfoBlock label="IP" value={log.ip_address || "—"} />
                            <InfoBlock label="Request ID" value={log.request_id || "—"} />
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="mb-1 flex items-center gap-2 text-sm font-medium"><Info className="h-4 w-4" />Tóm tắt</div>
                            <div className="text-sm text-muted-foreground">{log.summary || "Không có tóm tắt"}</div>
                            {isFallback(log) && (
                                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                    Log này là audit yếu: hệ thống chỉ ghi request/body/path, chưa có before/after nghiệp vụ. Nếu endpoint này quan trọng, cần bổ sung ghi audit riêng bằng AuditService.
                                </div>
                            )}
                            {log.detail_ref_type && <div className="mt-2 text-xs text-muted-foreground">Chi tiết: {log.detail_ref_type} #{log.detail_ref_id}</div>}
                        </div>

                        <div className="overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader><TableRow><TableHead>Trường</TableHead><TableHead>Giá trị cũ</TableHead><TableHead>Giá trị mới</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {fields.map((field) => (
                                        <TableRow key={field} className={changedFields.has(field) ? "bg-amber-50/70" : undefined}>
                                            <TableCell className="w-48 align-top font-medium">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {humanize(field)}
                                                    {changedFields.has(field) && <Badge className="bg-amber-100 text-amber-700">Đã đổi</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-80 break-all align-top text-muted-foreground">{displayValue(oldValues[field])}</TableCell>
                                            <TableCell className="max-w-80 break-all align-top">{displayValue(newValues[field])}</TableCell>
                                        </TableRow>
                                    ))}
                                    {fields.length === 0 && <TableRow><TableCell colSpan={3} className="h-20 text-center text-muted-foreground">Log này không có diff chi tiết.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 break-all text-sm font-medium">{value}</div>
        </div>
    )
}

function ActionBadge({ action }: { action: string }) {
    const risky = riskyActions.has(action)
    const label = actionLabel(action)
    const className = action === "CREATE" ? "bg-emerald-100 text-emerald-700" : action === "DELETE" ? "bg-red-100 text-red-700" : risky ? "bg-amber-100 text-amber-700" : action.includes("LOGIN") ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"
    return <Badge className={className}>{label}</Badge>
}

function ResultBadge({ status }: { status?: string | null }) {
    if (!status) return <Badge variant="outline">Chưa phân loại</Badge>
    const ok = status === "SUCCESS"
    const denied = status === "DENIED"
    return <Badge className={cn(ok && "bg-emerald-100 text-emerald-700", denied && "bg-amber-100 text-amber-700", !ok && !denied && "bg-red-100 text-red-700")}>{resultLabel(status)}</Badge>
}

function SourceBadge({ source }: { source?: string | null }) {
    return <Badge variant="outline">{source ? sourceLabel(source) : "Nguồn cũ"}</Badge>
}

function buildSubject(log: AuditLog, labelers: FilterValueLabelers) {
    return {
        module: (labelers.module ?? humanize)(log.module),
        entity: (labelers.entity_type ?? entityTypeLabel)(log.entity_type),
        title: inferRecordTitle(log) ?? `Bản ghi #${log.entity_id}`,
    }
}

function inferRecordTitle(log: AuditLog) {
    const values = { ...parseObject(log.old_values), ...parseObject(log.new_values) }
    const first = pickValue(values, ["code", "ma", "ma_vthh", "ma_kh", "sku", "order_code", "contract_code", "invoice_no", "document_no"])
    const second = pickValue(values, ["name", "ten", "ten_vthh", "customer_name", "supplier_name", "full_name", "email", "phone"])
    if (first && second && first !== second) return `${first} · ${second}`
    return first ?? second
}

function pickValue(values: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const value = values[key]
        if (typeof value === "string" && value.trim()) return value.trim()
        if (typeof value === "number" && Number.isFinite(value)) return String(value)
    }
    return undefined
}

function buildAuditSummary(log: AuditLog, changedFields: string[]) {
    if (log.summary?.trim()) return log.summary.trim()
    if (changedFields.length > 0) {
        const fieldText = changedFields.slice(0, 4).map(humanize).join(", ")
        const suffix = changedFields.length > 4 ? ` và ${changedFields.length - 4} trường khác` : ""
        return `${actionLabel(log.action)}: ${fieldText}${suffix}`
    }
    return `${actionLabel(log.action)} ${entityTypeLabel(log.entity_type).toLowerCase()}`
}

function buildRequestMetadata(log: AuditLog) {
    return [
        [log.request_method, log.request_path].filter(Boolean).join(" "),
        log.ip_address ? `IP ${log.ip_address}` : undefined,
        log.request_id ? `Request ${log.request_id}` : undefined,
    ].filter(Boolean).join(" · ")
}

function cleanFilters(value: AuditLogFilters) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== "")) as AuditLogFilters
}

function filterKey(value: AuditLogFilters) {
    const normalized = cleanFilters(value)
    return JSON.stringify(Object.keys(normalized).sort().reduce((acc, key) => ({ ...acc, [key]: normalized[key as keyof AuditLogFilters] }), {} as AuditLogFilters))
}

function optionValues(options?: AuditLogOption[], fallback: string[] = []) {
    return options?.length ? options.filter((option) => option.available !== false).map((option) => option.value) : fallback
}

function optionLabelMap(options?: AuditLogOption[]) {
    return new Map((options ?? []).map((option) => [option.value, option.label]))
}

function buildActiveChips(filters: AuditLogFilters, labelers: FilterValueLabelers = {}) {
    const labels: Partial<Record<FilterKey, string>> = {
        module: "Module",
        entity_type: "Đối tượng",
        entity_id: "Mã bản ghi",
        action: "Hành động",
        source_type: "Nguồn",
        result_status: "Kết quả",
        changed_by: "Người thao tác",
        from_date: "Từ ngày",
        to_date: "Đến ngày",
        keyword: "Từ khóa",
    }
    return (Object.entries(cleanFilters(filters)) as [keyof AuditLogFilters, string | number][])
        .filter(([key]) => key !== "page" && key !== "size")
        .map(([key, value]) => {
            const filterKey = key as FilterKey
            return { key: filterKey, label: `${labels[filterKey]}: ${filterValueLabel(filterKey, String(value), labelers)}` }
        })
}

function filterValueLabel(key: FilterKey, value: string, labelers: FilterValueLabelers = {}) {
    const labeler = labelers[key]
    if (labeler) return labeler(value)
    if (key === "action") return actionLabel(value)
    if (key === "source_type") return sourceLabel(value)
    if (key === "result_status") return resultLabel(value)
    if (key === "entity_type") return entityTypeLabel(value)
    if (key === "changed_by") return `ID ${value}`
    if (key === "from_date" || key === "to_date") return formatInputDate(value)
    if (key === "keyword") return value
    return humanize(value)
}

function normalizeEntityType(value: string) {
    if (/^auth_roles_\d+_permissions$/i.test(value)) return "role_permissions"
    if (/^inventory_costing_periods_\d+$/i.test(value)) return "inventory_costing_periods"
    if (/^inventory_costing_periods_\d+_calculate$/i.test(value)) return "inventory_costing_period_calculation"
    if (/^inventory_ledger_\d+_static-parameters$/i.test(value)) return "inventory_ledger_static_parameters"
    if (/^inventory_ledger_opening-cost-normalization(_\d+)?_.+/i.test(value)) return "inventory_opening_cost_normalization"
    if (/^inventory_ledger_negative-stock(_.+)?$/i.test(value)) return "inventory_negative_stock"
    if (/^inventory_ledger_account-rules(_.+)?$/i.test(value)) return "inventory_account_rules"
    if (/^inventory_ledger_(prices|purchase-base-prices)_.+/i.test(value)) return "inventory_price_imports"
    if (/^inventory_ledger_production-cost-objects_.+/i.test(value)) return "inventory_production_cost_objects"
    if (/^inventory_ledger_production-date-sync_.+/i.test(value)) return "inventory_production_date_sync"
    if (/^inventory_ledger_\d+_.+/i.test(value)) return "inventory_ledger_adjustments"
    if (/^productions_\d+_materials_\d+_preferred-lot$/i.test(value)) return "production_material_lot_selection"
    if (/^productions_\d+_materials$/i.test(value)) return "production_materials"
    if (/^productions_\d+_.+/i.test(value)) return "production_operations"
    if (/^sales_deliveries_\d+_status$/i.test(value)) return "sales_delivery_status"
    if (/^sales_exports_\d+_status$/i.test(value)) return "sales_export_status"
    if (/^sales_exports_\d+_export-time$/i.test(value)) return "sales_export_time"
    if (/^sales_exports_\d+_items_\d+_lot$/i.test(value)) return "sales_export_item_lot"
    if (/^sales_exports_\d+_items_\d+_warehouse$/i.test(value)) return "sales_export_item_warehouse"
    if (/^sales_orders_\d+_status$/i.test(value)) return "sales_order_status"
    if (/^sales_orders_\d+_price-adjustment$/i.test(value)) return "sales_order_price_adjustment"
    if (/^sales_orders_\d+_salesperson-adjustment$/i.test(value)) return "sales_order_salesperson_adjustment"
    if (/^sales_returns_\d+_status$/i.test(value)) return "sales_return_status"
    if (/^transactions_\d+_npp$/i.test(value)) return "sales_transaction_distributor"
    if (/^users_\d+_roles$/i.test(value)) return "user_roles"
    if (/^vip_customers_\d+_plan$/i.test(value)) return "vip_customer_plan"
    return value.replace(/(^|_)\d+(?=_|$)/g, "")
}

function entityTypeLabel(value: string) {
    const normalized = normalizeEntityType(value)
    const labels: Record<string, string> = {
        ar_ledger: "Công nợ phải thu",
        auth_logout: "Đăng xuất",
        role_permissions: "Phân quyền vai trò",
        contract: "Hợp đồng",
        contract_item: "Dòng hợp đồng",
        currency: "Tiền tệ",
        customer: "Khách hàng",
        inventory_costing_periods: "Kỳ tính giá",
        inventory_costing_period_calculation: "Chạy tính giá kỳ",
        inventory_ledger: "Sổ kho",
        inventory_ledger_adjustments: "Điều chỉnh sổ kho",
        inventory_ledger_static_parameters: "Tham số sổ kho",
        inventory_opening_cost_normalization: "Chuẩn hóa giá tồn đầu kỳ",
        inventory_negative_stock: "Kiểm tra tồn âm",
        inventory_account_rules: "Rule hạch toán kho",
        inventory_price_imports: "Import giá kho",
        inventory_production_cost_objects: "Import đối tượng giá thành",
        inventory_production_date_sync: "Đồng bộ ngày sản xuất",
        "inventory_vouchers_create-and-post": "Tạo và ghi sổ phiếu kho",
        "inventory_lots_purchase_import-csv": "Import lot mua hàng",
        "inventory_account-config": "Cấu hình tài khoản kho",
        order: "Đơn hàng",
        order_item: "Dòng đơn hàng",
        product: "Sản phẩm",
        "products_inventory-account-sync": "Đồng bộ tài khoản sản phẩm",
        productions: "Lệnh sản xuất",
        productions_boms: "BOM sản xuất",
        production_operations: "Thao tác lệnh sản xuất",
        production_materials: "Vật tư sản xuất",
        production_material_lot_selection: "Chọn lot vật tư sản xuất",
        purchasing_shipments: "Lô hàng mua",
        purchasing_payments: "Thanh toán mua hàng",
        sales_deliveries: "Giao hàng",
        sales_delivery_status: "Trạng thái giao hàng",
        sales_exports: "Phiếu xuất bán",
        sales_export_status: "Trạng thái phiếu xuất",
        sales_export_time: "Thời gian phiếu xuất",
        sales_export_item_lot: "Lot dòng xuất kho",
        sales_export_item_warehouse: "Kho dòng xuất",
        sales_orders: "Đơn hàng",
        sales_orders_items: "Dòng đơn hàng",
        sales_order_status: "Trạng thái đơn hàng",
        sales_order_price_adjustment: "Điều chỉnh giá đơn hàng",
        sales_order_salesperson_adjustment: "Điều chỉnh nhân viên bán hàng",
        "sales_ar-ledgers": "Công nợ phải thu",
        "sales_ar-ledgers_import-bank-excel": "Import sao kê công nợ",
        sales_transaction_distributor: "NPP giao dịch",
        sales_returns: "Hàng bán trả lại",
        sales_return_status: "Trạng thái hàng bán trả lại",
        "sales_returns_unit-prices": "Đơn giá hàng bán trả lại",
        "sales_price-quotes_import-excel": "Import báo giá",
        "salary_payroll-config_monthly-incomes": "Cấu hình thu nhập lương",
        "salary_payroll-config_tax-exemptions": "Cấu hình miễn trừ thuế",
        "salary_bonus-year_run": "Chạy thưởng năm",
        salary_run: "Chạy lương",
        "tools_sales-export-ar-missing-repair_preview": "Công cụ sửa thiếu công nợ xuất bán",
        "tools_sales-export-ar-missing-repair_apply": "Áp dụng sửa thiếu công nợ xuất bán",
        "tools_purchasing-shipment-contract-item-backfill_preview": "Công cụ backfill dòng hợp đồng",
        "tools_purchasing-shipment-contract-item-backfill_execute": "Chạy backfill dòng hợp đồng",
        "tools_inventory-account-over-sync-repair_check": "Kiểm tra sửa đồng bộ tài khoản kho",
        "tools_inventory-account-over-sync-repair_apply": "Áp dụng sửa đồng bộ tài khoản kho",
        "customers_historical-sync_check": "Kiểm tra đồng bộ lịch sử khách hàng",
        "customers_historical-sync_apply": "Đồng bộ lịch sử khách hàng",
        "customers_historical-sync_apply-mappings": "Đồng bộ mapping lịch sử khách hàng",
        user: "Người dùng",
        user_roles: "Vai trò người dùng",
        vip_customers_recalc: "Tính lại VIP khách hàng",
        vip_customer_plan: "Kế hoạch VIP khách hàng",
    }
    return labels[normalized] ?? humanize(normalized)
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
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    return String(value)
}

function buildMetrics(items: AuditLog[]) {
    return {
        risky: items.filter((item) => riskyActions.has(item.action)).length,
        fallback: items.filter(isFallback).length,
        failed: items.filter((item) => item.result_status === "FAILED" || item.result_status === "DENIED").length,
        latest: items[0]?.changed_at,
    }
}

function isFallback(log: AuditLog) {
    return log.source_type === "FALLBACK"
}

function humanize(value: string) {
    return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function actionLabel(action: string) {
    const labels: Record<string, string> = {
        CREATE: "Tạo mới",
        UPDATE: "Cập nhật",
        DELETE: "Xóa",
        EXECUTE: "Thực thi",
        CHECK: "Kiểm tra",
        PREVIEW: "Xem trước",
        IMPORT: "Import",
        APPLY: "Áp dụng",
        UPDATE_STATUS: "Đổi trạng thái",
        UPDATE_PERMISSIONS: "Đổi quyền",
        ADJUST_PRICE: "Sửa giá",
        ADJUST_QUANTITY: "Sửa số lượng",
        ADJUST_PP_STATUS: "Sửa PP",
        LOGIN_SUCCESS: "Login thành công",
        LOGIN_FAILED: "Login thất bại",
    }
    return labels[action] ?? humanize(action)
}

function resultLabel(status: string) {
    const labels: Record<string, string> = {
        SUCCESS: "Thành công",
        FAILED: "Thất bại",
        DENIED: "Bị từ chối",
    }
    return labels[status] ?? humanize(status)
}

function sourceLabel(source: string) {
    const labels: Record<string, string> = {
        USER: "Người dùng",
        SYSTEM: "Hệ thống",
        IMPORT: "Import",
        JOB: "Tác vụ nền",
        FALLBACK: "Audit yếu",
    }
    return labels[source] ?? humanize(source)
}

function dateInput(daysAgo: number) {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatInputDate(value: string) {
    const [year, month, day] = value.split("-")
    return year && month && day ? `${day}/${month}/${year}` : value
}

function formatDateTime(value: string) {
    const date = parseDate(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN")
}

function formatDate(value: string) {
    const date = parseDate(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN")
}

function formatTime(value: string) {
    const date = parseDate(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function parseDate(value: string) {
    const normalized = value?.includes("T") ? value : value?.replace(" ", "T")
    return new Date(normalized)
}

const actionOptions = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "EXECUTE",
    "CHECK",
    "PREVIEW",
    "IMPORT",
    "APPLY",
    "UPDATE_STATUS",
    "UPDATE_PERMISSIONS",
    "ADJUST_PRICE",
    "ADJUST_QUANTITY",
    "ADJUST_PP_STATUS",
    "LOGIN_SUCCESS",
    "LOGIN_FAILED",
]
