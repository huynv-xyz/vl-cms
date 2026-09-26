import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
    createCustomerLocation, deleteCustomerLocation, listCustomerLocations, updateCustomerLocation,
    type CustomerLocation, type CustomerLocationRequest,
} from "@/api/customer-location"
import { getCustomer } from "@/api/customer"
import {
    getAdministrativeUnit, getAdministrativeUnitCounterparts, listAdministrativeUnits,
    type AdministrativeUnit,
} from "@/api/geography"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Customer } from "../data/schema"
import { emptyLocationForm, type LocationFormState } from "./types"

type Props = { customer: Customer; open: boolean; onOpenChange: (open: boolean) => void; canUpdate: boolean }
export function CustomerLocationsDialog({ customer, open, onOpenChange, canUpdate, onAddressChange }: Props & { onAddressChange?: (address: string) => void }) {
    const queryClient = useQueryClient()
    const [editing, setEditing] = useState<CustomerLocation | null | undefined>(undefined)
    const [pendingDelete, setPendingDelete] = useState<CustomerLocation | null>(null)
    const [form, setForm] = useState<LocationFormState>(emptyLocationForm)
    const refreshCustomer = async () => {
        await queryClient.invalidateQueries({ queryKey: ["customer"] })
        if (onAddressChange) {
            try {
                const updated = await getCustomer(customer.id)
                onAddressChange(updated.address ?? "")
            } catch {
                toast.error("Đã lưu địa điểm nhưng chưa tải lại được địa chỉ giao dịch")
            }
        }
    }
    const { data, isLoading } = useQuery({
        queryKey: ["customer-locations", customer.id],
        queryFn: () => listCustomerLocations({ page: 1, size: 100, customer_id: customer.id }),
        enabled: open,
    })
    const openForm = (row: CustomerLocation | null) => {
        setEditing(row)
        setForm(row ? {
            id: row.id, name: row.name,
            address_detail: row.address_detail ?? "",
            old_admin_unit_id: row.old_admin_unit_id ?? undefined, current_admin_unit_id: row.current_admin_unit_id ?? undefined,
            latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
            location_accuracy_meters: row.location_accuracy_meters ?? undefined,
            location_verified: row.location_verified === 1, is_primary: row.is_primary === 1, status: row.status,
        } : { ...emptyLocationForm, is_primary: (data?.items.length ?? 0) === 0 })
    }
    const save = useMutation({
        mutationFn: () => {
            const body: CustomerLocationRequest = { ...form, customer_id: customer.id, location_verified: form.location_verified ? 1 : 0, is_primary: form.is_primary ? 1 : 0 }
            return editing ? updateCustomerLocation({ ...body, id: editing.id }) : createCustomerLocation(body)
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["customer-locations", customer.id] })
            await refreshCustomer()
            toast.success("Đã lưu địa điểm khách hàng")
            setEditing(undefined)
        },
        onError: (e: Error) => toast.error(e.message),
    })
    const remove = async (row: CustomerLocation) => {
        try {
            await deleteCustomerLocation(row.id)
            await queryClient.invalidateQueries({ queryKey: ["customer-locations", customer.id] })
            await refreshCustomer()
            toast.success("Đã xóa địa điểm")
            setPendingDelete(null)
        } catch (e) { toast.error(e instanceof Error ? e.message : "Không thể xóa địa điểm") }
    }

    return <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] w-[96vw] max-w-none flex-col overflow-hidden sm:max-w-[1600px]">
                <DialogHeader className="shrink-0"><DialogTitle>Địa điểm của {customer.code} - {customer.name}</DialogTitle></DialogHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                    {canUpdate && <div className="flex justify-end"><Button size="sm" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" />Thêm địa điểm</Button></div>}
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[1160px] table-fixed text-sm">
                            <colgroup><col className="w-[18%]" /><col className="w-[28%]" /><col className="w-[20%]" /><col className="w-[20%]" /><col className="w-[9%]" /><col className="w-[5%]" /></colgroup>
                            <thead className="bg-muted/70 text-left"><tr><Th>Tên địa điểm</Th><Th>Địa chỉ giao dịch</Th><Th>Địa giới cũ</Th><Th>Địa giới hiện tại</Th><Th>Tọa độ</Th><Th /></tr></thead>
                            <tbody>{isLoading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Đang tải...</td></tr> : data?.items.length ? data.items.map((row) =>
                                <tr key={row.id} className="border-t align-top">
                                    <Td><div className="flex items-center gap-1.5 font-medium">{row.is_primary === 1 && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}{row.name}</div>{row.is_primary === 1 && <span className="text-xs text-muted-foreground">Địa chỉ giao dịch</span>}</Td>
                                    <Td className="break-words">{fullAddress(row.address_detail || row.raw_address, row.current_admin_unit ?? row.old_admin_unit)}</Td>
                                    <Td className="break-words">{unitLabel(row.old_admin_unit)}</Td><Td className="break-words">{unitLabel(row.current_admin_unit)}</Td>
                                    <Td>{row.latitude != null && row.longitude != null ? `${row.latitude}, ${row.longitude}` : "-"}</Td>
                                    <Td>{canUpdate && <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Sửa" onClick={() => openForm(row)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Xóa" className="text-destructive" onClick={() => setPendingDelete(row)}><Trash2 className="h-4 w-4" /></Button></div>}</Td>
                                </tr>) : <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có địa điểm</td></tr>}</tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        <LocationFormDialog open={editing !== undefined} editing={editing ?? null} form={form} setForm={setForm}
            onClose={() => setEditing(undefined)} onSave={() => save.mutate()} saving={save.isPending} />
        <AlertDialog open={pendingDelete !== null} onOpenChange={(next) => !next && setPendingDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa địa điểm khách hàng?</AlertDialogTitle>
                    <AlertDialogDescription>Địa điểm “{pendingDelete?.name}” sẽ bị xóa. Nếu đây là địa điểm chính, hệ thống sẽ tự chọn địa điểm còn lại làm địa điểm chính.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => pendingDelete && remove(pendingDelete)}>Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
}

export function LocationFormDialog({ open, editing, form, setForm, onClose, onSave, saving }: {
    open: boolean
    editing: CustomerLocation | null
    form: LocationFormState
    setForm: Dispatch<SetStateAction<LocationFormState>>
    onClose: () => void
    onSave: (address: string) => void
    saving: boolean
}) {
    const queryClient = useQueryClient()
    const requestSeq = useRef(0)
    useEffect(() => { requestSeq.current += 1 }, [open, editing?.id])
    const oldMatches = useQuery({
        queryKey: ["administrative-unit-counterparts", form.old_admin_unit_id],
        queryFn: () => getAdministrativeUnitCounterparts(form.old_admin_unit_id!),
        enabled: open && form.old_admin_unit_id != null,
    })
    const currentMatches = useQuery({
        queryKey: ["administrative-unit-counterparts", form.current_admin_unit_id],
        queryFn: () => getAdministrativeUnitCounterparts(form.current_admin_unit_id!),
        enabled: open && form.current_admin_unit_id != null,
    })
    const oldUnit = useQuery({
        queryKey: ["administrative-unit", form.old_admin_unit_id],
        queryFn: () => getAdministrativeUnit(form.old_admin_unit_id!),
        enabled: open && form.old_admin_unit_id != null,
    })
    const currentUnit = useQuery({
        queryKey: ["administrative-unit", form.current_admin_unit_id],
        queryFn: () => getAdministrativeUnit(form.current_admin_unit_id!),
        enabled: open && form.current_admin_unit_id != null,
    })
    const oldSource = useMemo(() => locationUnitSource("OLD", form.current_admin_unit_id ?? undefined, queryClient),
        [form.current_admin_unit_id, queryClient])
    const currentSource = useMemo(() => locationUnitSource("CURRENT", form.old_admin_unit_id ?? undefined, queryClient),
        [form.old_admin_unit_id, queryClient])
    const mismatch = form.old_admin_unit_id != null && form.current_admin_unit_id != null
        && oldMatches.data != null
        && !oldMatches.data.items.some((unit) => unit.id === form.current_admin_unit_id)
    const detail = form.address_detail
    const selectUnit = async (version: "OLD" | "CURRENT", id?: number) => {
        const seq = ++requestSeq.current
        const field = version === "OLD" ? "old_admin_unit_id" : "current_admin_unit_id"
        const opposite = version === "OLD" ? "current_admin_unit_id" : "old_admin_unit_id"
        setForm((previous) => ({ ...previous, [field]: id }))
        if (id == null) return
        try {
            const matches = await queryClient.fetchQuery({
                queryKey: ["administrative-unit-counterparts", id],
                queryFn: () => getAdministrativeUnitCounterparts(id),
            })
            if (seq !== requestSeq.current) return
            setForm((previous) => {
                if (previous[field] !== id) return previous
                const nextId = matches.suggested_ids.length === 1
                    ? matches.suggested_ids[0]
                    : previous[opposite] != null && matches.items.some((unit) => unit.id === previous[opposite])
                        ? previous[opposite] : undefined
                return { ...previous, [opposite]: nextId }
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không tải được ánh xạ địa giới")
        }
    }
    return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{editing ? "Cập nhật địa điểm" : "Thêm địa điểm"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
            <Field label="Tên địa điểm"><Input value={form.name} placeholder="Ví dụ: Cửa hàng chính" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Trạng thái"><Select value={String(form.status)} onValueChange={(v) => setForm({ ...form, status: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Hoạt động</SelectItem><SelectItem value="0">Ngưng</SelectItem></SelectContent></Select></Field>
            <Field label="Địa chỉ chi tiết" className="md:col-span-2"><Textarea rows={2} value={form.address_detail ?? ""} onChange={(e) => setForm({ ...form, address_detail: e.target.value })} /></Field>
            {editing?.raw_address && <div className="md:col-span-2 text-sm"><Label className="mb-1.5 block">Địa chỉ nguồn</Label><p className="whitespace-pre-wrap rounded-md border bg-muted/40 px-3 py-2">{editing.raw_address}</p></div>}
            <Field label="Địa giới hành chính cũ"><AsyncSelect value={form.old_admin_unit_id} onChange={(v: number | undefined) => selectUnit("OLD", v)} dataSource={oldSource} mapOption={unitMap} placeholder="Chọn cấp nhỏ nhất đã biết" optionWrapLabel wrapLabel /></Field>
            <Field label="Địa giới hành chính hiện tại"><AsyncSelect value={form.current_admin_unit_id} onChange={(v: number | undefined) => selectUnit("CURRENT", v)} dataSource={currentSource} mapOption={unitMap} placeholder="Chọn cấp nhỏ nhất đã biết" optionWrapLabel wrapLabel /></Field>
            {mismatch && <p className="md:col-span-2 text-sm text-destructive">Hai địa giới đã chọn không có quan hệ ánh xạ. Vui lòng chọn lại một trong hai.</p>}
            {form.old_admin_unit_id != null && oldMatches.data?.items.length === 0 && <p className="md:col-span-2 text-sm text-amber-800">Địa giới cũ đã chọn chưa có ánh xạ sang địa giới hiện tại.</p>}
            {form.current_admin_unit_id != null && currentMatches.data?.items.length === 0 && <p className="md:col-span-2 text-sm text-amber-800">Địa giới hiện tại đã chọn chưa có ánh xạ về địa giới cũ.</p>}
            <div className="space-y-2 border-t pt-3 md:col-span-2">
                <AddressPreview label="Địa chỉ cũ" value={fullAddress(detail, oldUnit.data)} />
                <AddressPreview label="Địa chỉ hiện tại" value={fullAddress(detail, currentUnit.data)} />
            </div>
            <Field label="Vĩ độ (Latitude)"><Input type="number" step="any" value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: numberOrUndefined(e.target.value) })} /></Field>
            <Field label="Kinh độ (Longitude)"><Input type="number" step="any" value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: numberOrUndefined(e.target.value) })} /></Field>
            <Field label="Sai số tọa độ (m)"><Input type="number" min="0" step="any" value={form.location_accuracy_meters ?? ""} onChange={(e) => setForm({ ...form, location_accuracy_meters: numberOrUndefined(e.target.value) })} /></Field>
            <Toggle label="Địa điểm chính" checked={form.is_primary} onChange={(v) => setForm({ ...form, is_primary: v })} />
            <Toggle label="Đã xác minh tọa độ" checked={form.location_verified} onChange={(v) => setForm({ ...form, location_verified: v })} />
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={() => onSave(fullAddress(detail, currentUnit.data ?? oldUnit.data))} disabled={saving || !form.name.trim() || mismatch || (form.old_admin_unit_id != null && (oldUnit.isLoading || oldUnit.isError)) || (form.current_admin_unit_id != null && (currentUnit.isLoading || currentUnit.isError)) || (form.old_admin_unit_id != null && form.current_admin_unit_id != null && (oldMatches.isLoading || oldMatches.isError))}>{saving ? "Đang lưu..." : "Lưu"}</Button></DialogFooter>
    </DialogContent></Dialog>
}

function locationUnitSource(version: "OLD" | "CURRENT", oppositeId: number | undefined, queryClient: QueryClient) {
    return {
        params: { version, oppositeId },
        getList: async ({ keyword }: { keyword?: string }) => {
            if (oppositeId == null) return listAdministrativeUnits({ page: 1, size: 50, keyword, version, status: 1 })
            const matches = await queryClient.fetchQuery({
                queryKey: ["administrative-unit-counterparts", oppositeId],
                queryFn: () => getAdministrativeUnitCounterparts(oppositeId),
            })
            const term = keyword?.trim().toLocaleLowerCase("vi") ?? ""
            return { items: matches.items.filter((unit) =>
                !term || unitMap(unit).label.toLocaleLowerCase("vi").includes(term)) }
        },
        getById: getAdministrativeUnit,
    }
}

const unitTypeLabels: Record<string, string> = {
    PROVINCE: "Tỉnh", MUNICIPALITY: "Thành phố", DISTRICT: "Huyện",
    URBAN_DISTRICT: "Quận", TOWN: "Thị xã", PROVINCIAL_CITY: "Thành phố",
    COMMUNE: "Xã", WARD: "Phường", TOWNSHIP: "Thị trấn", SPECIAL_ZONE: "Đặc khu",
}
function unitName(unit: AdministrativeUnit) { return `${unitTypeLabels[unit.unit_type] ?? ""} ${unit.name}`.trim() }
function adminPath(unit: AdministrativeUnit) {
    const units = [unit, unit.district, unit.province]
    const unique = units.filter((item, index) => item && units.findIndex((candidate) => candidate?.id === item.id) === index) as AdministrativeUnit[]
    return unique.map(unitName).join(", ")
}
function unitMap(unit: AdministrativeUnit) { return { value: unit.id, label: adminPath(unit), raw: unit } }
function fullAddress(detail?: string | null, unit?: AdministrativeUnit) {
    return [detail?.trim(), unit && adminPath(unit), unit && "Việt Nam"].filter(Boolean).join(", ") || "Chưa có địa chỉ"
}

export function DraftCustomerLocationsDialog({ name, open, onOpenChange, value, address, onChange }: {
    name: string
    open: boolean
    onOpenChange: (open: boolean) => void
    value: LocationFormState | null
    address: string
    onChange: (value: LocationFormState | null, address: string) => void
}) {
    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<LocationFormState>(emptyLocationForm)
    const edit = () => {
        setForm(value ? { ...value } : { ...emptyLocationForm, name: "Cửa hàng chính", is_primary: true })
        setFormOpen(true)
    }
    return <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader><DialogTitle>Địa điểm của {name.trim() || "khách hàng mới"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="flex justify-end"><Button size="sm" onClick={edit}><Plus className="mr-2 h-4 w-4" />{value ? "Sửa địa điểm" : "Thêm địa điểm"}</Button></div>
                    {value ? <div className="flex items-start justify-between gap-3 border-t py-3">
                        <div className="min-w-0 space-y-1 text-sm">
                            <div className="flex items-center gap-2 font-medium"><Star className="h-4 w-4 fill-amber-400 text-amber-500" />{value.name}<span className="text-xs font-normal text-muted-foreground">Địa chỉ giao dịch</span></div>
                            <p className="break-words text-muted-foreground">{address || "Chưa có địa chỉ"}</p>
                        </div>
                        <Button variant="ghost" size="icon" title="Bỏ địa điểm" onClick={() => onChange(null, "")}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div> : <p className="border-t py-5 text-center text-sm text-muted-foreground">Chưa có địa điểm</p>}
                </div>
            </DialogContent>
        </Dialog>
        <LocationFormDialog open={formOpen} editing={null} form={form} setForm={setForm}
            onClose={() => setFormOpen(false)} saving={false}
            onSave={(fullAddress) => {
                onChange({ ...form, is_primary: true }, fullAddress === "Chưa có địa chỉ" ? "" : fullAddress)
                setFormOpen(false)
            }} />
    </>
}
function AddressPreview({ label, value }: { label: string; value: string }) {
    return <div className="grid gap-1 text-sm sm:grid-cols-[145px_minmax(0,1fr)]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="break-words">{value}</span>
    </div>
}

function numberOrUndefined(value: string) { return value === "" ? undefined : Number(value) }
function unitLabel(unit?: AdministrativeUnit) { return unit ? adminPath(unit) : "-" }
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) { return <div className={className}><Label className="mb-1.5 block">{label}</Label>{children}</div> }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="flex min-h-10 items-center justify-between rounded-md border px-3"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div> }
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-3 py-2 font-semibold">{children}</th> }
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) { return <td className={`px-3 py-2 ${className}`}>{children}</td> }
