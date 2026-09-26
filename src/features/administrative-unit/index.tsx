import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Building2, Funnel, Landmark, MapPin, Pencil } from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions, hasPermission } from "@/api/auth/permission"
import {
    getBusinessArea,
    getAdministrativeUnit,
    getAdministrativeUnitSummary,
    listAdministrativeUnits,
    listAdministrativeUnitDirectory,
    listBusinessAreas,
    updateAdministrativeUnitMapping,
    type AdministrativeUnitInput,
    type AdministrativeUnit,
    type AdministrativeUnitDirectoryRow,
    type AdministrativeUnitMapping,
    type AdministrativeUnitMappingRequest,
    type AdministrativeUnitPath,
    type BusinessArea,
} from "@/api/geography"
import { MasterDataReportTable } from "@/components/master-data-report-table"
import { PageSection } from "@/components/page-section"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/administrative-units"
import { ImportAdministrativeUnitsButton } from "./import-administrative-units-button"
import { BoundaryFilesButton } from "./boundary-files-button"
import { BoundaryMapButton } from "./boundary-map-button"

type View = "OLD" | "CURRENT"
type Level = "PROVINCE" | "DISTRICT" | "WARD"
type FilterKey = "view" | "status" | "mapping_type" | "region_id" | "business_area_id" | "province_id" | "district_id" | "ward_id"
    | "counterpart_province_id" | "counterpart_district_id" | "counterpart_ward_id"
type FilterValues = Record<FilterKey, string>
type DraftPath = {
    province: AdministrativeUnitInput
    district?: AdministrativeUnitInput
    ward?: AdministrativeUnitInput
}
type FormState = { old_path: DraftPath; current_path: DraftPath; old_leaf_level: "DISTRICT" | "WARD"; mapping_type: "FULL" | "PARTIAL"; status: number }

const unitTypes: Record<Level, Array<[string, string]>> = {
    PROVINCE: [["PROVINCE", "Tỉnh"], ["MUNICIPALITY", "Thành phố"]],
    DISTRICT: [["DISTRICT", "Huyện"], ["URBAN_DISTRICT", "Quận"], ["TOWN", "Thị xã"], ["PROVINCIAL_CITY", "Thành phố thuộc tỉnh"]],
    WARD: [["COMMUNE", "Xã"], ["WARD", "Phường"], ["TOWNSHIP", "Thị trấn"], ["SPECIAL_ZONE", "Đặc khu"]],
}
const typeLabels = Object.fromEntries(Object.values(unitTypes).flat())
const blankUnit = (level: Level): AdministrativeUnitInput => ({ unit_type: unitTypes[level][0][0], name: "" })
const newForm = (): FormState => ({
    old_path: { province: blankUnit("PROVINCE"), district: blankUnit("DISTRICT"), ward: blankUnit("WARD") },
    current_path: { province: blankUnit("PROVINCE"), ward: blankUnit("WARD") },
    old_leaf_level: "WARD",
    mapping_type: "FULL",
    status: 1,
})

export default function AdministrativeUnitPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, singleFilters, setKeyword, setSingleFilters } = useUrlListFilters(search, navigate, [], [
        "view", "status", "mapping_type", "region_id", "business_area_id", "province_id", "district_id", "ward_id",
        "counterpart_province_id", "counterpart_district_id", "counterpart_ward_id",
    ])
    const view: View = singleFilters.view === "CURRENT" ? "CURRENT" : "OLD"
    const provinceId = numberOrUndefined(singleFilters.province_id)
    const districtId = numberOrUndefined(singleFilters.district_id)
    const regionId = numberOrUndefined(singleFilters.region_id)
    const [editing, setEditing] = useState<AdministrativeUnitMapping | null | undefined>(undefined)
    const [form, setForm] = useState<FormState>(newForm())
    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const summaryQuery = useQuery({
        queryKey: ["administrative-unit-summary", view],
        queryFn: () => getAdministrativeUnitSummary(view),
    })
    const canUpdate = hasPermission(permissionsQuery.data ?? [], "administrative-units", "update")
    const administrativeUnitId = singleFilters.ward_id || singleFilters.district_id || singleFilters.province_id
    const counterpartAdministrativeUnitId = singleFilters.counterpart_ward_id || singleFilters.counterpart_district_id || singleFilters.counterpart_province_id
    const provinceFilterSource = useMemo(() => administrativeUnitSource(view, "PROVINCE"), [view])
    const districtFilterSource = useMemo(() => administrativeUnitSource(view, "DISTRICT", provinceId), [view, provinceId])
    const wardFilterSource = useMemo(() => administrativeUnitSource(
        view,
        "WARD",
        view === "OLD" ? districtId : provinceId,
        view === "OLD" && !districtId ? provinceId : undefined,
    ), [view, provinceId, districtId])
    const regionFilterSource = useMemo(() => businessAreaSource("REGION"), [])
    const areaFilterSource = useMemo(() => businessAreaSource("AREA", regionId), [regionId])
    const { data, isLoading, error } = usePaginatedList(
        ["administrative-unit-mappings", search.page, search.size, keyword, view, singleFilters],
        listAdministrativeUnitDirectory,
        {
            page: search.page,
            size: search.size,
            keyword,
            view,
            administrative_unit_id: administrativeUnitId ? Number(administrativeUnitId) : undefined,
            counterpart_administrative_unit_id: counterpartAdministrativeUnitId ? Number(counterpartAdministrativeUnitId) : undefined,
            mapping_type: (singleFilters.mapping_type || undefined) as "FULL" | "PARTIAL" | undefined,
            region_id: singleFilters.region_id ? Number(singleFilters.region_id) : undefined,
            business_area_id: singleFilters.business_area_id ? Number(singleFilters.business_area_id) : undefined,
            status: singleFilters.status ? Number(singleFilters.status) : undefined,
        },
    )

    const openForm = (item: AdministrativeUnitMapping) => {
        setEditing(item)
        setForm(formFromMapping(item))
    }
    const save = useMutation({
        mutationFn: () => {
            const request = toRequest(form)
            if (!editing) throw new Error("Không tìm thấy ánh xạ cần cập nhật")
            return updateAdministrativeUnitMapping({ id: editing.id, ...request })
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["administrative-unit-mappings"] })
            await queryClient.invalidateQueries({ queryKey: ["administrative-unit"] })
            await queryClient.invalidateQueries({ queryKey: ["administrative-unit-summary"] })
            toast.success("Đã lưu ánh xạ địa giới hành chính")
            setEditing(undefined)
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const columns = useMemo<ColumnDef<AdministrativeUnitDirectoryRow>[]>(() => {
        const targetTitle = view === "OLD" ? "Địa giới hiện tại" : "Địa giới cũ"
        return [
            { id: "index", header: "STT", size: 60, cell: ({ row }) => (search.page - 1) * search.size + row.index + 1 },
            { id: "province", header: () => <AsyncFilterHeader title="Tỉnh/Thành phố" value={provinceId} dataSource={provinceFilterSource}
                onChange={(value) => setSingleFilters({ province_id: stringOrUndefined(value), district_id: undefined, ward_id: undefined })} />, size: 180, cell: ({ row }) => formatUnit(row.original.source_path.province) },
            ...(view === "OLD" ? [{ id: "district", header: () => <AsyncFilterHeader title="Huyện/Quận" value={districtId} dataSource={districtFilterSource}
                onChange={(value: number | undefined) => setSingleFilters({ district_id: stringOrUndefined(value), ward_id: undefined })} />, size: 180,
                cell: ({ row }: { row: { original: AdministrativeUnitDirectoryRow } }) => formatUnit(row.original.source_path.district) }] : []),
            { id: "ward", header: () => <AsyncFilterHeader title="Xã/Phường" value={numberOrUndefined(singleFilters.ward_id)} dataSource={wardFilterSource}
                onChange={(value) => setSingleFilters({ ward_id: stringOrUndefined(value) })} />,
                size: 195, cell: ({ row }) => <span className="font-medium">{row.original.source_path.ward ? formatUnit(row.original.source_path.ward) : "Không có cấp xã/phường"}</span> },
            { id: "counterpart", header: () => <CounterpartFilterHeader title={targetTitle} version={view === "OLD" ? "CURRENT" : "OLD"}
                values={singleFilters} onChange={setSingleFilters} />, size: 480,
                cell: ({ row }) => <CounterpartMappings mappings={row.original.counterparts} view={view} canUpdate={canUpdate} onEdit={openForm} /> },
            { id: "region", header: () => <AsyncFilterHeader title="Vùng" value={regionId} dataSource={regionFilterSource} mapOption={mapAreaOption}
                onChange={(value) => setSingleFilters({ region_id: stringOrUndefined(value), business_area_id: undefined })} />,
                size: 165, cell: ({ row }) => formatDirectoryAreas(row.original, view, "REGION") },
            { id: "area", header: () => <AsyncFilterHeader title="Khu vực" value={numberOrUndefined(singleFilters.business_area_id)} dataSource={areaFilterSource} mapOption={mapAreaOption}
                onChange={(value) => setSingleFilters({ business_area_id: stringOrUndefined(value) })} />,
                size: 175, cell: ({ row }) => formatDirectoryAreas(row.original, view, "AREA") },
            { id: "status", header: () => <SelectFilterHeader title="Trạng thái" value={singleFilters.status}
                options={[["1", "Hoạt động"], ["0", "Ngưng"]]} onChange={(value) => setSingleFilters({ status: value })} />,
                size: 125, cell: ({ row }) => <DirectoryStatus mappings={row.original.counterparts} /> },
        ]
    }, [areaFilterSource, canUpdate, districtFilterSource, districtId, provinceFilterSource, provinceId, regionFilterSource, regionId, search.page, search.size, singleFilters, view, wardFilterSource])

    return <>
        <PageSection
            title="Địa giới hành chính"
            isLoading={isLoading}
            error={error}
            data={data}
            actions={<div className="flex flex-wrap items-center justify-end gap-3">
                <ViewSelector value={view} onChange={(value) => setSingleFilters({
                    view: value, province_id: undefined, district_id: undefined, ward_id: undefined,
                    counterpart_province_id: undefined, counterpart_district_id: undefined, counterpart_ward_id: undefined,
                })} />
                <BoundaryFilesButton canUpdate={canUpdate} />
                <BoundaryMapButton initialView={view} />
                {canUpdate && <ImportAdministrativeUnitsButton />}
            </div>}
        >
            {(result) => <MasterDataReportTable
                data={result.items}
                columns={columns}
                entityName="đơn vị hành chính"
                summaryLabel="Đơn vị hành chính"
                summaryItems={view === "OLD" ? [
                    { label: "Tỉnh/Thành phố", value: summaryQuery.data?.PROVINCE ?? 0, icon: Landmark },
                    { label: "Huyện/Quận", value: summaryQuery.data?.DISTRICT ?? 0, icon: Building2 },
                    { label: "Xã/Phường", value: summaryQuery.data?.WARD ?? 0, icon: MapPin },
                ] : [
                    { label: "Tỉnh/Thành phố", value: summaryQuery.data?.PROVINCE ?? 0, icon: Landmark },
                    { label: "Xã/Phường", value: summaryQuery.data?.WARD ?? 0, icon: MapPin },
                ]}
                icon={Landmark}
                tableTitle="Danh sách đối chiếu địa giới"
                tableClassName="[&_th]:overflow-hidden [&_th]:whitespace-nowrap [&_tbody_td]:overflow-hidden [&_tbody_td]:whitespace-nowrap [&_tbody_td]:text-ellipsis"
                searchPlaceholder="Tìm theo tên tỉnh, huyện, xã/phường..."
                pagination={pagination}
                onPaginationChange={setPagination}
                pageCount={result.total_page}
                keyword={keyword}
                onKeywordChange={(value) => {
                    setPagination((current) => ({ ...current, pageIndex: 0 }))
                    setKeyword(value)
                }}
            />}
        </PageSection>
        <MappingDialog
            open={editing !== undefined}
            editing={editing ?? null}
            form={form}
            setForm={setForm}
            onClose={() => setEditing(undefined)}
            onSave={() => save.mutate()}
            saving={save.isPending}
        />
    </>
}

function MappingDialog({ open, editing, form, setForm, onClose, onSave, saving }: {
    open: boolean
    editing: AdministrativeUnitMapping | null
    form: FormState
    setForm: (form: FormState) => void
    onClose: () => void
    onSave: () => void
    saving: boolean
}) {
    const updateUnit = (side: "old_path" | "current_path", level: keyof DraftPath, patch: Partial<AdministrativeUnitInput>) => {
        const path = form[side]
        const current = path[level]
        if (!current) return
        setForm({ ...form, [side]: { ...path, [level]: { ...current, ...patch } } })
    }
    const ready = hasCompletePath(form.old_path, "OLD", form.old_leaf_level) && hasCompletePath(form.current_path, "CURRENT")
    return <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[min(1600px,96vw)]">
            <DialogHeader>
                <DialogTitle>{editing ? "Cập nhật ánh xạ địa giới" : "Thêm ánh xạ địa giới"}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Nhập đồng thời hai tuyến tương ứng. Hệ thống tự nối cha-con và dùng lại đơn vị đã có trong cùng tuyến.</p>
            <div className="grid gap-6 py-2 lg:grid-cols-2">
                <PathPanel title="Địa giới hành chính cũ" version="OLD" path={form.old_path} oldLeafLevel={form.old_leaf_level} onChange={updateUnit} />
                <PathPanel title="Địa giới hành chính hiện tại" version="CURRENT" path={form.current_path} onChange={updateUnit} />
            </div>
            <div className="border-t pt-4">
                <Field label="Trạng thái">
                    <Select value={String(form.status)} onValueChange={(value) => setForm({ ...form, status: Number(value) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="1">Hoạt động</SelectItem><SelectItem value="0">Ngưng</SelectItem></SelectContent>
                    </Select>
                </Field>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Hủy</Button>
                <Button onClick={onSave} disabled={saving || !ready}>{saving ? "Đang lưu..." : "Lưu ánh xạ"}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}

function PathPanel({ title, version, path, oldLeafLevel, onChange }: { title: string; version: View; path: DraftPath; oldLeafLevel?: "DISTRICT" | "WARD"; onChange: (side: "old_path" | "current_path", level: keyof DraftPath, patch: Partial<AdministrativeUnitInput>) => void }) {
    const side = version === "OLD" ? "old_path" : "current_path"
    const fields: Array<[keyof DraftPath, Level, string]> = version === "OLD"
        ? [["province", "PROVINCE", "Tỉnh/Thành phố"], ["district", "DISTRICT", "Huyện/Quận"], ["ward", "WARD", "Xã/Phường"]]
        : [["province", "PROVINCE", "Tỉnh/Thành phố"], ["ward", "WARD", "Xã/Phường"]]
    return <section className="min-w-0 rounded-md border bg-muted/20 p-5">
        <div className="mb-4 border-b pb-3"><h3 className="font-semibold">{title}</h3></div>
        <div className="space-y-4">
            {fields.map(([key, level, label]) => {
                const item = path[key] ?? blankUnit(level)
                const disabled = version === "OLD" && key === "ward" && oldLeafLevel === "DISTRICT"
                return <div key={key} className="grid gap-3 md:grid-cols-[150px_minmax(150px,0.75fr)_minmax(230px,1.4fr)] md:items-end">
                    <div className="pb-2 text-sm font-medium">{label}</div>
                    <Field label="Loại đơn vị">
                        <Select value={item.unit_type} disabled={disabled} onValueChange={(value) => onChange(side, key, { unit_type: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{unitTypes[level].map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent>
                        </Select>
                    </Field>
                    <Field label="Tên đơn vị">
                        <Input value={item.name} disabled={disabled} onChange={(event) => onChange(side, key, { name: event.target.value })} placeholder={disabled ? "Không áp dụng" : `Nhập ${label.toLowerCase()}`} />
                    </Field>
                </div>
            })}
        </div>
    </section>
}

function toRequest(form: FormState): AdministrativeUnitMappingRequest {
    if (!hasCompletePath(form.old_path, "OLD", form.old_leaf_level) || !hasCompletePath(form.current_path, "CURRENT")) {
        throw new Error("Cần nhập đầy đủ tỉnh/thành phố, huyện/quận, xã/phường cũ và tỉnh/thành phố, xã/phường hiện tại")
    }
    return {
        old_path: cleanPath(form.old_path, "OLD", form.old_leaf_level),
        current_path: cleanPath(form.current_path, "CURRENT"),
        mapping_type: form.mapping_type,
        status: form.status,
    }
}

function cleanPath(path: DraftPath, version: View, oldLeafLevel: "DISTRICT" | "WARD" = "WARD"): AdministrativeUnitPath {
    const unit = (item: AdministrativeUnitInput) => ({ id: item.id, unit_type: item.unit_type, name: item.name.trim() })
    return version === "OLD"
        ? { province: unit(path.province), district: unit(path.district!), ...(oldLeafLevel === "WARD" ? { ward: unit(path.ward!) } : {}) }
        : { province: unit(path.province), ward: unit(path.ward!) }
}

function hasCompletePath(path: DraftPath, version: View, oldLeafLevel: "DISTRICT" | "WARD" = "WARD") {
    const required = version === "OLD"
        ? oldLeafLevel === "DISTRICT" ? [path.province, path.district] : [path.province, path.district, path.ward]
        : [path.province, path.ward]
    return required.every((item) => item?.name.trim() && item.unit_type)
}

function formFromMapping(item: AdministrativeUnitMapping): FormState {
    return {
        old_path: {
            province: { ...item.old_path.province },
            district: item.old_path.district ? { ...item.old_path.district } : blankUnit("DISTRICT"),
            ward: item.old_path.ward ? { ...item.old_path.ward } : blankUnit("WARD"),
        },
        current_path: { province: { ...item.current_path.province }, ward: { ...item.current_path.ward! } },
        old_leaf_level: item.old_path.ward ? "WARD" : "DISTRICT",
        mapping_type: item.mapping_type,
        status: item.status,
    }
}

function formatUnit(item?: AdministrativeUnitInput) {
    return item ? `${typeLabels[item.unit_type] ?? item.unit_type} ${item.name}` : "-"
}

function formatPath(path: AdministrativeUnitPath, version: View) {
    const units = version === "OLD" ? [path.province, path.district, path.ward] : [path.province, path.ward]
    return units.filter(Boolean).map((item) => formatUnit(item as AdministrativeUnitInput)).join(" / ")
}

function CounterpartMappings({ mappings, view, canUpdate, onEdit }: {
    mappings: AdministrativeUnitMapping[]
    view: View
    canUpdate: boolean
    onEdit: (mapping: AdministrativeUnitMapping) => void
}) {
    const [expanded, setExpanded] = useState(false)
    if (!mappings.length) return <span className="text-muted-foreground">Chưa có ánh xạ</span>
    const targetVersion = view === "OLD" ? "CURRENT" : "OLD"
    const visibleMappings = expanded ? mappings : mappings.slice(0, 2)
    return <div className="w-full min-w-0">
        <div className="divide-y">
        {visibleMappings.map((mapping) => {
            const path = view === "OLD" ? mapping.current_path : mapping.old_path
            const pathLabel = formatPath(path, targetVersion)
            return <div key={mapping.id} className="flex min-w-0 items-center gap-2 py-2 first:pt-0 last:pb-0">
                    <span className="min-w-0 flex-1 truncate text-sm leading-5" title={pathLabel}>{pathLabel}</span>
                    {mapping.mapping_type === "PARTIAL"
                        ? <Badge variant="outline" title="Chỉ một phần địa bàn của đơn vị cũ được chuyển sang đơn vị hiện tại này"
                            className="shrink-0 border-amber-300 bg-amber-50 text-amber-800">Một phần</Badge>
                        : <Badge variant="secondary" title="Toàn bộ địa bàn của đơn vị cũ được chuyển sang đơn vị hiện tại này"
                            className="shrink-0">Toàn bộ</Badge>}
                    {canUpdate && <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Sửa ánh xạ"
                        onClick={() => onEdit(mapping)}><Pencil className="h-3.5 w-3.5" /></Button>}
            </div>
        })}
        </div>
        {mappings.length > 2 && <button type="button" className="mt-2 text-sm font-medium text-primary hover:underline"
            onClick={() => setExpanded((current) => !current)}>
            {expanded ? "Thu gọn" : `Xem thêm ${mappings.length - 2} đơn vị`}
        </button>}
    </div>
}

function DirectoryStatus({ mappings }: { mappings: AdministrativeUnitMapping[] }) {
    if (!mappings.length) return <Badge variant="outline" className="text-muted-foreground">Chưa ánh xạ</Badge>
    if (mappings.every((mapping) => mapping.status === 1)) {
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Hoạt động</Badge>
    }
    return <Badge variant="secondary">Có ánh xạ ngưng</Badge>
}

function formatDirectoryAreas(row: AdministrativeUnitDirectoryRow, view: View, level: "REGION" | "AREA") {
    const areas = view === "CURRENT"
        ? row.business_area ? [row.business_area] : []
        : row.counterparts.map((mapping) => mapping.business_area).filter(Boolean) as BusinessArea[]
    const labels = [...new Set(areas.map((area) => level === "REGION" ? formatRegion(area) : formatArea(area)).filter((label) => label !== "-"))]
    if (!labels.length) return "-"
    const source = view === "CURRENT" && level === "AREA"
        ? row.business_area_source === "INHERITED"
            ? ` (kế thừa từ ${row.business_area_inherited_from ?? "tỉnh/thành phố"})`
            : " (gán riêng)"
        : ""
    return <span title={labels.join(", ") + source} className="block truncate">{labels.join(", ")}{source}</span>
}

function mapAreaOption(area: BusinessArea) { return { value: area.id, label: formatBusinessArea(area) } }
function formatBusinessArea(area?: BusinessArea) {
    if (!area) return "-"
    const areaLabel = `${area.code} - ${area.name}`
    return area.parent ? `${area.parent.code} - ${area.parent.name} / ${areaLabel}` : areaLabel
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>
}

function ViewSelector({ value, onChange }: { value: View; onChange: (value: View) => void }) {
    return <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">Góc nhìn địa giới</span>
        <Tabs value={value} onValueChange={(next) => onChange(next as View)}>
            <TabsList className="h-9 rounded-md">
                <TabsTrigger value="CURRENT" className="min-w-[132px] rounded-sm">Địa giới hiện tại</TabsTrigger>
                <TabsTrigger value="OLD" className="min-w-[112px] rounded-sm">Địa giới cũ</TabsTrigger>
            </TabsList>
        </Tabs>
    </div>
}
function formatRegion(area?: BusinessArea) { return area?.parent ? `${area.parent.code} - ${area.parent.name}` : "-" }
function formatArea(area?: BusinessArea) { return area ? `${area.code} - ${area.name}` : "-" }

function administrativeUnitSource(version: View, level: Level, parentId?: number, ancestorId?: number) {
    return {
        params: { version, level, parent_id: parentId, ancestor_id: ancestorId },
        getList: ({ keyword, version: requestedVersion, level: requestedLevel, parent_id, ancestor_id }: any) => listAdministrativeUnits({
            page: 1, size: 100, keyword, version: requestedVersion, level: requestedLevel, parent_id, ancestor_id, status: 1,
        }),
        getById: getAdministrativeUnit,
    }
}

function businessAreaSource(areaType: "REGION" | "AREA", parentId?: number) {
    return {
        params: { parent_id: parentId },
        getList: ({ keyword, parent_id }: any) => listBusinessAreas({
            page: 1, size: 100, keyword, area_type: areaType, parent_id, status: 1,
        }),
        getById: getBusinessArea,
    }
}

function FilterHeader({ title, active, children }: { title: string; active: boolean; children: React.ReactNode }) {
    return <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate">{title}</span>
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" aria-label={`Lọc ${title}`} title={`Lọc ${title}`}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-background/80 ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                    <Funnel className="h-3.5 w-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 overflow-hidden p-0">{children}</PopoverContent>
        </Popover>
    </div>
}

function AsyncFilterHeader({ title, value, dataSource, onChange, disabled = false, mapOption = mapAdministrativeOption }: {
    title: string
    value?: number
    dataSource: any
    onChange: (value?: number) => void
    disabled?: boolean
    mapOption?: (item: any) => { value: number; label: string; raw?: any }
}) {
    return <FilterHeader title={title} active={value != null}>
        <AsyncSelect inline value={value} dataSource={dataSource} mapOption={mapOption} disabled={disabled}
            searchPlaceholder={disabled ? "Chọn cấp cha trước" : "Tìm kiếm..."}
            clearText="Bỏ chọn"
            onChange={(next: number | undefined) => onChange(next)} />
    </FilterHeader>
}

function SelectFilterHeader({ title, value, options, onChange }: {
    title: string
    value?: string
    options: Array<[string, string]>
    onChange: (value?: string) => void
}) {
    return <FilterHeader title={title} active={Boolean(value)}>
        <div className="space-y-1 p-1">
            {[["", "Tất cả"], ...options].map(([optionValue, label]) =>
                <button key={optionValue || "all"} type="button" onClick={() => onChange(optionValue || undefined)}
                    className={`flex w-full items-center rounded-sm px-3 py-2 text-left text-sm hover:bg-muted ${(value || "") === optionValue ? "bg-muted font-medium text-primary" : ""}`}>
                    {label}
                </button>)}
        </div>
    </FilterHeader>
}

function CounterpartFilterHeader({ title, version, values, onChange }: {
    title: string
    version: View
    values: FilterValues
    onChange: (next: Partial<Record<FilterKey, string | undefined>>) => void
}) {
    const provinceId = numberOrUndefined(values.counterpart_province_id)
    const districtId = numberOrUndefined(values.counterpart_district_id)
    const provinceSource = useMemo(() => administrativeUnitSource(version, "PROVINCE"), [version])
    const districtSource = useMemo(() => administrativeUnitSource(version, "DISTRICT", provinceId), [version, provinceId])
    const wardSource = useMemo(() => administrativeUnitSource(
        version,
        "WARD",
        version === "OLD" ? districtId : provinceId,
        version === "OLD" && !districtId ? provinceId : undefined,
    ), [version, provinceId, districtId])
    const active = Boolean(values.counterpart_province_id || values.counterpart_district_id || values.counterpart_ward_id)
    return <FilterHeader title={title} active={active}>
        <div className="space-y-3 p-3">
            <Field label="Tỉnh/Thành phố"><AsyncSelect value={provinceId} dataSource={provinceSource} mapOption={mapAdministrativeOption}
                placeholder="Tất cả tỉnh/thành phố" onChange={(value: number | undefined) => onChange({
                    counterpart_province_id: stringOrUndefined(value), counterpart_district_id: undefined, counterpart_ward_id: undefined,
                })} /></Field>
            {version === "OLD" && <Field label="Huyện/Quận"><AsyncSelect value={districtId} dataSource={districtSource} mapOption={mapAdministrativeOption}
                placeholder="Tất cả huyện/quận"
                onChange={(value: number | undefined) => onChange({ counterpart_district_id: stringOrUndefined(value), counterpart_ward_id: undefined })} /></Field>}
            <Field label="Xã/Phường"><AsyncSelect value={numberOrUndefined(values.counterpart_ward_id)} dataSource={wardSource} mapOption={mapAdministrativeOption}
                placeholder="Tất cả xã/phường"
                onChange={(value: number | undefined) => onChange({ counterpart_ward_id: stringOrUndefined(value) })} /></Field>
        </div>
    </FilterHeader>
}

function mapAdministrativeOption(unit: AdministrativeUnit) {
    return { value: unit.id, label: formatUnit(unit), raw: unit }
}
function numberOrUndefined(value?: string) { return value ? Number(value) : undefined }
function stringOrUndefined(value?: number) { return value == null ? undefined : String(value) }
