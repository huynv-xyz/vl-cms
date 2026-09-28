import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Columns3, GripVertical, Loader2, MoreHorizontal, Pin, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { getTablePreference, saveTablePreference } from "@/api/ui-preference"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { CARGO_COLUMNS, type CargoColumn } from "./columns"

type ColumnKey = CargoColumn["key"]
type Preference = { columns: { key: ColumnKey; visible: boolean }[]; pinnedColumnKey: ColumnKey | null }
const queryKey = ["table-preference", "purchasing.cargo-details"]
const defaults = (): Preference => ({ columns: CARGO_COLUMNS.map(column => ({ key: column.key, visible: true })), pinnedColumnKey: null })

function resolve(preference: Preference | null | undefined): Preference {
    const keys = new Set(CARGO_COLUMNS.map(column => column.key))
    const seen = new Set<ColumnKey>()
    const columns = (Array.isArray(preference?.columns) ? preference.columns : []).filter(column => {
        if (!keys.has(column.key) || seen.has(column.key)) return false
        seen.add(column.key)
        return true
    }).map(column => ({ key: column.key, visible: column.visible !== false }))
    columns.push(...defaults().columns.filter(column => !seen.has(column.key)))
    return {
        columns: columns.some(column => column.visible) ? columns : defaults().columns,
        pinnedColumnKey: columns.some(column => column.visible && column.key === preference?.pinnedColumnKey) ? preference!.pinnedColumnKey : null,
    }
}

export function useCargoPreferences() {
    const query = useQuery({ queryKey, queryFn: () => getTablePreference<Preference>("purchasing.cargo-details") })
    const preference = resolve(query.data)
    return { preference, columns: preference.columns.filter(column => column.visible).map(column => CARGO_COLUMNS.find(item => item.key === column.key)!), isLoading: query.isLoading, error: query.error }
}

export function CargoPreferencesControl() {
    const { preference, isLoading, error } = useCargoPreferences()
    const client = useQueryClient()
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<Preference>(defaults)
    const mutation = useMutation({
        mutationFn: (next: Preference) => saveTablePreference("purchasing.cargo-details", next),
        onSuccess: next => { client.setQueryData(queryKey, next); toast.success("Đã lưu tùy chỉnh bảng."); setOpen(false) },
        onError: error => toast.error(error instanceof Error ? error.message : "Không lưu được tùy chỉnh bảng."),
    })
    const move = (source: string, target: ColumnKey) => {
        const from = draft.columns.findIndex(column => column.key === source)
        const to = draft.columns.findIndex(column => column.key === target)
        if (from < 0 || to < 0 || from === to) return
        const columns = [...draft.columns]
        const [item] = columns.splice(from, 1)
        columns.splice(to, 0, item)
        setDraft({ ...draft, columns })
    }
    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Tùy chỉnh mẫu báo cáo" title="Tùy chỉnh mẫu báo cáo"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled={isLoading} onSelect={() => {
                if (error) { toast.error("Không tải được mẫu báo cáo đã lưu."); return }
                setDraft(preference); setOpen(true)
            }}><Columns3 className="mr-2 h-4 w-4" />Tùy chỉnh mẫu báo cáo</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="w-[min(96vw,560px)] gap-0 p-0 sm:max-w-none">
                <SheetHeader className="border-b px-6 py-5"><SheetTitle>Tùy chỉnh mẫu báo cáo</SheetTitle><SheetDescription className="sr-only">Cấu hình các cột của báo cáo thông tin hàng hóa.</SheetDescription></SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-[32px_minmax(0,1fr)_72px_64px] border-b bg-muted px-3 py-2 text-xs font-semibold"><span /><span>Cột</span><span className="text-center">Hiện</span><span className="text-center">Pin</span></div>
                    {draft.columns.map(column => <div key={column.key} draggable
                        onDragStart={event => event.dataTransfer.setData("text/plain", column.key)}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => { event.preventDefault(); move(event.dataTransfer.getData("text/plain"), column.key) }}
                        className="grid grid-cols-[32px_minmax(0,1fr)_72px_64px] items-center border-b px-3 py-2">
                        <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                        <span className="text-sm">{CARGO_COLUMNS.find(item => item.key === column.key)?.label}</span>
                        <div className="flex justify-center"><Checkbox aria-label={`Hiện ${column.key}`} checked={column.visible} onCheckedChange={checked => setDraft({
                            columns: draft.columns.map(item => item.key === column.key ? { ...item, visible: checked === true } : item),
                            pinnedColumnKey: !checked && draft.pinnedColumnKey === column.key ? null : draft.pinnedColumnKey,
                        })} /></div>
                        <Button variant="ghost" size="icon" className="mx-auto h-7 w-7" disabled={!column.visible}
                            title={draft.pinnedColumnKey === column.key ? "Bỏ pin mặc định" : "Pin mặc định đến cột này"}
                            onClick={() => setDraft({ ...draft, pinnedColumnKey: draft.pinnedColumnKey === column.key ? null : column.key })}>
                            <Pin className={`h-4 w-4 ${draft.pinnedColumnKey === column.key ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </Button>
                    </div>)}
                </div>
                <SheetFooter className="flex-row justify-between border-t px-6 py-4 sm:flex-row">
                    <Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => setDraft(defaults())}><RotateCcw className="mr-2 h-4 w-4" />Mặc định</Button>
                    <div className="flex gap-2"><Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => setOpen(false)}>Đóng</Button>
                        <Button size="sm" disabled={mutation.isPending || !draft.columns.some(column => column.visible)} onClick={() => mutation.mutate(draft)}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu</Button></div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    </>
}
