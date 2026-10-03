import { forwardRef, useState, type ComponentPropsWithoutRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Funnel, X } from "lucide-react"
import { cargoOptionSource, type CargoOption, type CargoOptionKind } from "@/api/purchasing/cargo-details"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export const FilterTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof Button> & { label: string; active: boolean }>(function FilterTrigger({ label, active, ...props }, ref) {
    return <Button ref={ref} variant="ghost" size="icon" className={`h-7 w-7 shrink-0 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
        title={`Lọc ${label}`} aria-label={`Lọc ${label}`} {...props}><Funnel className="h-3.5 w-3.5" /></Button>
})

export function MultiColumnFilter({ label, value, onChange, kind, options }: {
    label: string; value: string[]; onChange: (values: string[]) => void; kind?: CargoOptionKind; options?: readonly CargoOption[]
}) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<string[]>([])
    const [keyword, setKeyword] = useState("")
    const query = useQuery({
        queryKey: ["cargo-filter-options", kind, keyword],
        queryFn: () => cargoOptionSource(kind!).getList({ keyword }),
        enabled: open && Boolean(kind),
    })
    // Keep selected options visible even when the search result no longer includes them.
    const selected = useQuery({
        queryKey: ["cargo-filter-selected", kind, draft],
        queryFn: () => Promise.all(draft.map(id => cargoOptionSource(kind!).getById(id))),
        enabled: open && Boolean(kind) && draft.length > 0,
    })
    const available = options ? options.filter(item => item.label.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())) : query.data?.items ?? []
    const merged = new Map<string, CargoOption>()
    for (const option of [...(selected.data ?? []), ...available]) merged.set(String(option.value), option)
    const items = [...merged.values()].sort((a, b) => Number(draft.includes(String(b.value))) - Number(draft.includes(String(a.value))))
    return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) { setDraft(value); setKeyword("") } }}>
        <PopoverTrigger asChild><FilterTrigger label={label} active={value.length > 0} /></PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-32px)] p-0">
            <div className="space-y-2 border-b p-3"><div className="text-sm font-semibold">Lọc {label}</div><Input aria-label={`Tìm ${label}`} placeholder="Tìm kiếm..." value={keyword} onChange={event => setKeyword(event.target.value)} /></div>
            <div className="max-h-72 overflow-y-auto p-2">
                {query.isFetching && kind && <p className="p-2 text-sm text-muted-foreground">Đang tải...</p>}
                {(query.error || selected.error) && <p role="alert" className="p-2 text-sm text-destructive">Không tải được danh sách.</p>}
                {items.map(item => <label key={item.value} className="flex cursor-pointer items-start gap-2 rounded p-2 text-sm hover:bg-muted">
                    <Checkbox className="mt-0.5" checked={draft.includes(String(item.value))} onCheckedChange={checked => setDraft(current => checked ? [...current, String(item.value)] : current.filter(id => id !== String(item.value)))} />
                    <span className="min-w-0 break-words">{item.label}</span>
                </label>)}
                {!items.length && !query.isFetching && !query.error && <p className="p-2 text-sm text-muted-foreground">Không có dữ liệu</p>}
            </div>
            <div className="flex items-center justify-between border-t p-3"><Button variant="ghost" size="sm" onClick={() => setDraft([])}>Xóa chọn</Button>
                <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Hủy</Button><Button size="sm" disabled={Boolean(query.error || selected.error)} onClick={() => { onChange(draft); setOpen(false) }}>Áp dụng</Button></div>
            </div>
        </PopoverContent>
    </Popover>
}

export function DateColumnFilter({ label, from, to, sortDirection, onChange }: {
    label: string; from: string; to: string; sortDirection?: "asc" | "desc";
    onChange: (from: string, to: string, direction?: "asc" | "desc") => void
}) {
    const [open, setOpen] = useState(false)
    const [draftFrom, setFrom] = useState("")
    const [draftTo, setTo] = useState("")
    const [draftSort, setSort] = useState<"asc" | "desc">()
    return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) { setFrom(from); setTo(to); setSort(sortDirection) } }}>
        <PopoverTrigger asChild><FilterTrigger label={label} active={Boolean(from || to || sortDirection)} /></PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-32px)] space-y-3">
            <div className="flex items-center justify-between gap-3"><div className="text-sm font-semibold">Lọc {label}</div>
                <div className="flex shrink-0 gap-1" aria-label={`Sắp xếp ${label}`}>
                    <Button variant="ghost" size="icon" className={`h-8 w-8 border ${draftSort === "asc" ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground"}`}
                        aria-label="Sắp xếp tăng dần" title="Tăng dần" aria-pressed={draftSort === "asc"} onClick={() => setSort(current => current === "asc" ? undefined : "asc")}><ArrowUpNarrowWide className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className={`h-8 w-8 border ${draftSort === "desc" ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground"}`}
                        aria-label="Sắp xếp giảm dần" title="Giảm dần" aria-pressed={draftSort === "desc"} onClick={() => setSort(current => current === "desc" ? undefined : "desc")}><ArrowDownWideNarrow className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs">Từ ngày<Input type="date" aria-label="Từ ngày" value={draftFrom} max={draftTo || undefined} onChange={event => setFrom(event.target.value)} /></label>
                <label className="space-y-1 text-xs">Đến ngày<Input type="date" aria-label="Đến ngày" value={draftTo} min={draftFrom || undefined} onChange={event => setTo(event.target.value)} /></label>
            </div>
            <div className="flex justify-end gap-2 border-t pt-3"><Button variant="ghost" size="sm" onClick={() => { onChange("", "", undefined); setOpen(false) }}>Xóa lọc</Button>
                <Button size="sm" disabled={Boolean(draftFrom && draftTo && draftFrom > draftTo)} onClick={() => { onChange(draftFrom, draftTo, draftSort); setOpen(false) }}>Áp dụng</Button></div>
        </PopoverContent>
    </Popover>
}

export function FilterChip({ label, values, kind, options, onClear }: { label: string; values: string[]; kind?: CargoOptionKind; options?: readonly CargoOption[]; onClear: () => void }) {
    const query = useQuery({
        queryKey: ["cargo-filter-labels", kind, values],
        queryFn: () => Promise.all(values.map(id => cargoOptionSource(kind!).getById(id))),
        enabled: Boolean(kind) && values.length > 0,
    })
    const labels = values.map(value => [...(query.data ?? []), ...(options ?? [])].find(item => String(item.value) === value)?.label ?? value)
    return <Badge variant="secondary" className="max-w-full gap-1 whitespace-normal break-words py-1 pl-2 pr-1 font-normal">
        <span>{label}: {labels.join(", ")}</span><Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" aria-label={`Xóa bộ lọc ${label}`} onClick={onClear}><X className="h-3 w-3" /></Button>
    </Badge>
}
