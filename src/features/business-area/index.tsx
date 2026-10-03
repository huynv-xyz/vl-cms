import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Layers3, MapPinned, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
    assignBusinessTerritory,
    assignBusinessTerritoryBatch,
    createBusinessArea,
    deleteBusinessArea,
    getAdministrativeUnit,
    getBusinessArea,
    getBusinessTerritory,
    listAdministrativeUnits,
    listBusinessAreas,
    previewBusinessTerritory,
    previewBusinessTerritoryBatch,
    updateBusinessArea,
    type AdministrativeUnit,
    type BusinessArea,
    type TerritoryBatchPreview,
    type TerritoryOldTarget,
    type TerritoryUnit,
} from "@/api/geography"
import { getMyPermissions, hasPermission } from "@/api/auth/permission"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { CrudTable } from "@/components/crud/crud-table"
import { PageSection } from "@/components/page-section"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { cn, formatNumber } from "@/lib/utils"
import { exportXlsx } from "@/lib/xlsx-export"
import { Route } from "@/routes/_authenticated/business-areas"

type AreaType = "REGION" | "AREA"
type AreaForm = {
    area_type: AreaType
    code: string
    name: string
    parent_id?: number
    status: number
}

const emptyForm = (areaType: AreaType, parentId?: number): AreaForm => ({
    area_type: areaType,
    code: "",
    name: "",
    parent_id: areaType === "AREA" ? parentId : undefined,
    status: 1,
})

export default function BusinessAreaPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, singleFilters, setKeyword, setSingle } = useUrlListFilters(search, navigate, [], ["status"])
    const [regionKeyword, setRegionKeyword] = useState("")
    const [selectedRegionId, setSelectedRegionId] = useState<number>()
    const [editing, setEditing] = useState<BusinessArea | null | undefined>(undefined)
    const [territoryArea, setTerritoryArea] = useState<BusinessArea | null>(null)
    const [form, setForm] = useState<AreaForm>(emptyForm("REGION"))

    const permissionsQuery = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const canUpdate = hasPermission(permissionsQuery.data ?? [], "business-areas", "update")
    const status = singleFilters.status ? Number(singleFilters.status) : undefined

    const regionsQuery = useQuery({
        queryKey: ["business-area", "regions", regionKeyword, status],
        queryFn: () => listBusinessAreas({
            page: 1,
            size: 200,
            keyword: regionKeyword,
            area_type: "REGION",
            status,
        }),
    })
    const areasQuery = useQuery({
        queryKey: ["business-area", "areas", selectedRegionId, search.page, search.size, keyword, status],
        queryFn: () => listBusinessAreas({
            page: search.page,
            size: search.size,
            keyword,
            area_type: "AREA",
            parent_id: selectedRegionId,
            status,
        }),
        enabled: selectedRegionId != null,
    })
    const regionSummaryQuery = useQuery({
        queryKey: ["business-area", "summary", "REGION"],
        queryFn: () => listBusinessAreas({ page: 1, size: 1, area_type: "REGION" }),
    })
    const areaSummaryQuery = useQuery({
        queryKey: ["business-area", "summary", "AREA"],
        queryFn: () => listBusinessAreas({ page: 1, size: 1, area_type: "AREA" }),
    })

    const regions = regionsQuery.data?.items ?? []
    const selectedRegion = regions.find((region) => region.id === selectedRegionId)

    useEffect(() => {
        if (!regions.length) {
            setSelectedRegionId(undefined)
            return
        }
        if (!regions.some((region) => region.id === selectedRegionId)) {
            setSelectedRegionId(regions[0].id)
            setPagination((current) => ({ ...current, pageIndex: 0 }))
        }
    }, [regions, selectedRegionId, setPagination])

    const openCreate = (areaType: AreaType) => {
        setEditing(null)
        setForm(emptyForm(areaType, areaType === "AREA" ? selectedRegionId : undefined))
    }

    const openEdit = (row: BusinessArea) => {
        setEditing(row)
        setForm({
            area_type: row.area_type,
            code: row.code,
            name: row.name,
            parent_id: row.parent_id ?? undefined,
            status: row.status,
        })
    }

    const save = useMutation({
        mutationFn: () => editing
            ? updateBusinessArea({ id: editing.id, ...form })
            : createBusinessArea(form),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["business-area"] })
            toast.success(form.area_type === "REGION" ? "Đã lưu vùng quản lý" : "Đã lưu khu vực quản lý")
            setEditing(undefined)
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const remove = async (row: BusinessArea) => {
        try {
            await deleteBusinessArea(row.id)
            if (row.area_type === "REGION" && row.id === selectedRegionId) setSelectedRegionId(undefined)
            await queryClient.invalidateQueries({ queryKey: ["business-area"] })
            toast.success(row.area_type === "REGION" ? "Đã xóa vùng quản lý" : "Đã xóa khu vực quản lý")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không thể xóa dữ liệu")
        }
    }

    const areaColumns = useMemo<ColumnDef<BusinessArea>[]>(() => [
        {
            id: "index",
            header: "STT",
            size: 64,
            cell: ({ row }) => (search.page - 1) * search.size + row.index + 1,
        },
        {
            accessorKey: "code",
            header: "Mã khu vực",
            size: 150,
            cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
        },
        { accessorKey: "name", header: "Tên khu vực", size: 300,
            cell: ({ row }) => <button type="button" className="text-left font-medium text-primary hover:underline"
                onClick={() => setTerritoryArea(row.original)}>{row.original.name}</button> },
        {
            accessorKey: "status",
            header: "Trạng thái",
            size: 130,
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "actions",
            header: "",
            size: 110,
            cell: ({ row }) => <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                    title="Địa bàn quản lý" aria-label={`Địa bàn quản lý của ${row.original.name}`}
                    onClick={() => setTerritoryArea(row.original)}><MapPinned className="h-4 w-4" /></Button>
                {canUpdate && <CrudRowActions row={row.original} onEdit={openEdit} onDelete={remove} />}
            </div>,
        },
    ], [canUpdate, search.page, search.size])

    const areaResult = areasQuery.data ?? {
        items: [],
        total: 0,
        current_page: 1,
        total_page: 0,
        size: search.size,
    }

    return <>
        <PageSection
            title="Phân vùng quản lý"
            description="Tổ chức theo hai cấp: Vùng và các Khu vực trực thuộc"
            isLoading={regionsQuery.isLoading}
            error={regionsQuery.error}
            data={{ regions, areaResult }}
        >
            {() => <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2">
                    <SummaryMetric icon={Layers3} label="Vùng quản lý" value={regionSummaryQuery.data?.total ?? 0} />
                    <SummaryMetric icon={MapPinned} label="Khu vực quản lý" value={areaSummaryQuery.data?.total ?? 0} />
                </div>

                <div className="flex justify-end">
                    <FilterSelect
                        value={singleFilters.status ?? "all"}
                        onChange={(value) => setSingle("status", value === "all" ? undefined : value)}
                        items={[["all", "Tất cả trạng thái"], ["1", "Hoạt động"], ["0", "Ngưng"]]}
                    />
                </div>

                <div className="grid min-h-[520px] overflow-hidden rounded-md border bg-background lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="border-b bg-slate-50/60 lg:border-b-0 lg:border-r">
                        <div className="border-b p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">Vùng</h2>
                                    <p className="text-xs text-muted-foreground">{formatNumber(regionsQuery.data?.total ?? 0)} vùng</p>
                                </div>
                                {canUpdate && <Button type="button" variant="outline" size="icon"
                                    className="h-8 w-8 shrink-0" title="Thêm vùng" aria-label="Thêm vùng"
                                    onClick={() => openCreate("REGION")}>
                                    <Plus className="h-4 w-4" />
                                </Button>}
                            </div>
                            <SearchOnBlurInput
                                value={regionKeyword}
                                onChange={setRegionKeyword}
                                placeholder="Tìm vùng..."
                                wrapperClassName="relative h-9"
                                className="h-9 bg-white pl-9"
                            />
                        </div>
                        <div className="max-h-[620px] overflow-y-auto p-2">
                            {regions.length ? regions.map((region) => {
                                const selected = region.id === selectedRegionId
                                return <div key={region.id} className={cn(
                                    "group flex items-center gap-2 rounded-md border border-transparent px-3 py-2.5",
                                    selected ? "border-sky-200 bg-sky-50" : "hover:bg-white",
                                )}>
                                    <button
                                        type="button"
                                        className="min-w-0 flex-1 text-left"
                                        onClick={() => {
                                            setSelectedRegionId(region.id)
                                            setPagination((current) => ({ ...current, pageIndex: 0 }))
                                        }}
                                    >
                                        <div className="truncate text-sm font-semibold" title={region.name}>{region.name}</div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{region.code}</span>
                                            <StatusBadge status={region.status} compact />
                                        </div>
                                    </button>
                                    {canUpdate && <CrudRowActions row={region} onEdit={openEdit} onDelete={remove} />}
                                </div>
                            }) : <div className="px-3 py-8 text-center text-sm text-muted-foreground">Không có vùng phù hợp</div>}
                        </div>
                    </aside>

                    <section className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 border-b p-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate font-semibold">
                                    {selectedRegion ? `Khu vực thuộc ${selectedRegion.name}` : "Khu vực"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {selectedRegion ? `${selectedRegion.code} · ${formatNumber(areaResult.total)} khu vực` : "Chọn một vùng để xem các khu vực trực thuộc"}
                                </p>
                            </div>
                            {canUpdate && <Button type="button" variant="outline" size="icon"
                                className="h-8 w-8 shrink-0" title="Thêm khu vực" aria-label="Thêm khu vực"
                                disabled={!selectedRegion} onClick={() => openCreate("AREA")}>
                                <Plus className="h-4 w-4" />
                            </Button>}
                            <SearchOnBlurInput
                                value={keyword}
                                onChange={(value) => {
                                    setPagination((current) => ({ ...current, pageIndex: 0 }))
                                    setKeyword(value)
                                }}
                                placeholder="Tìm mã hoặc tên khu vực..."
                                wrapperClassName="relative h-9 min-w-[260px]"
                                className="h-9 pl-9"
                            />
                        </div>
                        {selectedRegion ? <div className="p-4">
                            <CrudTable
                                data={areaResult.items}
                                columns={areaColumns}
                                entityName="khu vực"
                                pagination={pagination}
                                onPaginationChange={setPagination}
                                pageCount={areaResult.total_page}
                                showToolbar={false}
                                enableColumnResize
                                enableStickyHorizontalScroll
                                headerVariant="report"
                                footer={false}
                            />
                        </div> : <div className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
                            Chọn một vùng ở danh sách bên trái
                        </div>}
                    </section>
                </div>
            </div>}
        </PageSection>

        <AreaDialog
            open={editing !== undefined}
            editing={editing ?? null}
            form={form}
            setForm={setForm}
            onClose={() => setEditing(undefined)}
            onSave={() => save.mutate()}
            saving={save.isPending}
        />
        <TerritoryDialog area={territoryArea} canUpdate={canUpdate} onClose={() => setTerritoryArea(null)} />
    </>
}

function TerritoryDialog({ area, canUpdate, onClose }: { area: BusinessArea | null; canUpdate: boolean; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [version, setVersion] = useState<"OLD" | "CURRENT">("CURRENT")
    const [level, setLevel] = useState<"PROVINCE" | "DISTRICT" | "WARD">("PROVINCE")
    const [unitIds, setUnitIds] = useState<number[]>([])
    const [batchPending, setBatchPending] = useState(false)
    const [pending, setPending] = useState<{ unitId: number; targetAreaId?: number }>()
    const territoryQuery = useQuery({
        queryKey: ["business-area", "territory", area?.id],
        queryFn: () => getBusinessTerritory(area!.id),
        enabled: area != null,
    })
    const previewQuery = useQuery({
        queryKey: ["business-area", "territory-preview", pending?.unitId, pending?.targetAreaId],
        queryFn: () => previewBusinessTerritory(pending!.unitId, pending!.targetAreaId),
        enabled: pending != null,
    })
    const batchPreviewQuery = useQuery({
        queryKey: ["business-area", "territory-batch-preview", area?.id, version, unitIds.join(",")],
        queryFn: () => previewBusinessTerritoryBatch(version, unitIds, area!.id),
        enabled: batchPending && area != null && unitIds.length > 0,
        retry: false,
    })
    const source = useMemo(() => ({
        params: { level, version },
        getList: ({ keyword, level: requestedLevel, version: requestedVersion }: { keyword?: string; level: "PROVINCE" | "DISTRICT" | "WARD"; version: "OLD" | "CURRENT" }) =>
            listAdministrativeUnits({ page: 1, size: 100, keyword, version: requestedVersion, level: requestedLevel, status: 1 }),
        getById: getAdministrativeUnit,
    }), [level, version])
    const save = useMutation({
        mutationFn: () => assignBusinessTerritory(pending!.unitId, pending!.targetAreaId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["business-area", "territory"] })
            await queryClient.invalidateQueries({ queryKey: ["business-area", "territory-batch-preview"] })
            await queryClient.invalidateQueries({ queryKey: ["administrative-unit-mappings"] })
            toast.success("Đã cập nhật địa bàn quản lý")
            setPending(undefined)
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const batchSave = useMutation({
        mutationFn: () => assignBusinessTerritoryBatch(
            version, unitIds, area!.id,
            version === "OLD" ? batchPreviewQuery.data?.auto_unit_ids : undefined,
        ),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["business-area", "territory"] })
            await queryClient.invalidateQueries({ queryKey: ["business-area", "territory-batch-preview"] })
            await queryClient.invalidateQueries({ queryKey: ["administrative-unit-mappings"] })
            toast.success("Đã gán địa bàn quản lý")
            setBatchPending(false)
            setUnitIds([])
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const close = () => {
        setPending(undefined)
        setBatchPending(false)
        setUnitIds([])
        onClose()
    }
    const territory = territoryQuery.data
    const preview = previewQuery.data
    return <Dialog open={area != null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[min(1100px,96vw)]">
            <DialogHeader><DialogTitle>Địa bàn quản lý · {area?.name}</DialogTitle></DialogHeader>
            {territoryQuery.isLoading ? <p className="text-sm text-muted-foreground">Đang tải địa bàn...</p>
                : territoryQuery.isError ? <p className="text-sm text-destructive">Không tải được địa bàn: {(territoryQuery.error as Error).message}</p>
                    : <div className="space-y-5">
                        <div className="flex flex-wrap gap-x-6 gap-y-1 border-b pb-4 text-sm">
                            <span><strong>{formatNumber(territory?.provinces.length ?? 0)}</strong> tỉnh/thành phố được gán</span>
                            <span><strong>{formatNumber(territory?.wards.length ?? 0)}</strong> xã/phường được gán riêng</span>
                            <span><strong>{formatNumber(territory?.effective_wards ?? 0)}</strong> xã/phường thuộc khu vực</span>
                        </div>
                        {canUpdate && <div className="space-y-3 border-b pb-5">
                            <Tabs value={version} onValueChange={(value) => {
                                setVersion(value as "OLD" | "CURRENT")
                                if (value === "CURRENT" && level === "DISTRICT") setLevel("PROVINCE")
                                setUnitIds([])
                                setBatchPending(false)
                            }}>
                                <TabsList><TabsTrigger value="CURRENT">Địa giới hiện tại</TabsTrigger><TabsTrigger value="OLD">Địa giới cũ</TabsTrigger></TabsList>
                            </Tabs>
                            <div className="grid gap-3 sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:items-end">
                                <Field label="Cấp địa giới">
                                    <Select value={level} onValueChange={(value) => { setLevel(value as "PROVINCE" | "DISTRICT" | "WARD"); setBatchPending(false) }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PROVINCE">Tỉnh/Thành phố</SelectItem>
                                            {version === "OLD" && <SelectItem value="DISTRICT">Huyện/Quận</SelectItem>}
                                            <SelectItem value="WARD">Xã/Phường</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Chọn đơn vị hành chính">
                                    <AsyncMultiSelect value={unitIds} onChange={(ids: Array<string | number>) => {
                                        setUnitIds(ids.map(Number))
                                        setBatchPending(false)
                                    }} dataSource={source} mapOption={territoryOption}
                                        placeholder="Tìm và chọn nhiều đơn vị..." />
                                </Field>
                                <Button type="button" disabled={!unitIds.length || unitIds.length > 200}
                                    onClick={() => { setPending(undefined); setBatchPending(true) }}>Gán {unitIds.length} đơn vị</Button>
                            </div>
                            {unitIds.length > 200 && <p className="text-sm text-destructive">Chọn tối đa 200 đơn vị mỗi lần gán.</p>}
                        </div>}
                        {batchPending && <BatchTerritoryPreview
                            version={version}
                            targetAreaName={area?.name ?? ""}
                            data={batchPreviewQuery.data}
                            loading={batchPreviewQuery.isFetching}
                            error={batchPreviewQuery.error}
                            saving={batchSave.isPending}
                            onCancel={() => setBatchPending(false)}
                            onConfirm={() => batchSave.mutate()}
                        />}
                        {pending && <div className="space-y-3 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm">
                            {previewQuery.isLoading ? <p>Đang tính phạm vi ảnh hưởng...</p>
                                : previewQuery.isError ? <p className="text-destructive">{(previewQuery.error as Error).message}</p>
                                    : preview && <>
                                        <p className="font-medium">{pending.targetAreaId ? "Gán" : "Bỏ gán"}: {preview.unit_name}</p>
                                        <p>{formatNumber(preview.affected_wards)} xã/phường sẽ đổi khu vực hiệu lực.
                                            {preview.level === "PROVINCE" && ` ${formatNumber(preview.preserved_overrides)} xã/phường gán riêng được giữ nguyên.`}</p>
                                    </>}
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setPending(undefined)}>Hủy</Button>
                                <Button type="button" disabled={!preview || previewQuery.isLoading || save.isPending}
                                    onClick={() => save.mutate()}>{save.isPending ? "Đang lưu..." : "Xác nhận"}</Button>
                            </div>
                        </div>}
                        <TerritoryList title="Tỉnh/Thành phố" units={territory?.provinces ?? []}
                            canUpdate={canUpdate} onRemove={(id) => { setBatchPending(false); setPending({ unitId: id }) }} />
                        <TerritoryList title="Xã/Phường gán riêng" units={territory?.wards ?? []}
                            canUpdate={canUpdate} onRemove={(id) => { setBatchPending(false); setPending({ unitId: id }) }} />
                    </div>}
            <DialogFooter><Button type="button" variant="outline" onClick={close}>Đóng</Button></DialogFooter>
        </DialogContent>
    </Dialog>
}

const territoryDecisionLabels: Record<TerritoryOldTarget["decision"], string> = {
    READY: "Có thể gán",
    ALREADY: "Đã đúng khu vực",
    CROSS_BOUNDARY: "Vượt phạm vi",
    OTHER_AREA: "Khu vực khác",
    MAPPING_ISSUE: "Cần đối chiếu",
}

function BatchTerritoryPreview({ version, targetAreaName, data, loading, error, saving, onCancel, onConfirm }: {
    version: "OLD" | "CURRENT"
    targetAreaName: string
    data?: TerritoryBatchPreview
    loading: boolean
    error: Error | null
    saving: boolean
    onCancel: () => void
    onConfirm: () => void
}) {
    const [decision, setDecision] = useState("ALL")
    const [keyword, setKeyword] = useState("")
    const targets = data?.targets ?? []
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi")
    const visibleTargets = targets.filter((item) =>
        (decision === "ALL" || item.decision === decision)
        && (!normalizedKeyword || [item.name, item.province_name, item.current_area_name,
            ...item.old_constituents.map((source) => source.path)]
            .some((value) => value?.toLocaleLowerCase("vi").includes(normalizedKeyword))))
    const exportReport = () => {
        if (!data) return
        exportXlsx("doi-chieu-dia-ban-quan-ly", [
            {
                name: "Đối chiếu",
                rows: [
                    ["Xã/Phường hiện tại", "Tỉnh/Thành phố hiện tại", "Đơn vị cũ cấu thành",
                        "Nguồn ngoài phạm vi", "Khu vực hiện tại", "Khu vực dự kiến", "Kết quả"],
                    ...targets.map((item) => [
                        item.name, item.province_name ?? "",
                        item.old_constituents.map((source) => source.path).join("; "),
                        item.old_constituents.filter((source) => !source.within_selection)
                            .map((source) => source.path).join("; "),
                        item.current_area_name ?? "Chưa gán", targetAreaName,
                        territoryDecisionLabels[item.decision],
                    ]),
                ],
            },
            {
                name: "Thiếu ánh xạ",
                rows: [
                    ["Đơn vị cũ", "Cấp cha", "Tỉnh/Thành phố"],
                    ...(data.missing_old_units ?? []).map((item) =>
                        [item.name, item.parent_name ?? "", item.province_name ?? ""]),
                ],
            },
        ])
    }
    return <section className="space-y-4 rounded-md border border-sky-200 bg-sky-50/50 p-4 text-sm">
        {loading ? <p>Đang đối chiếu địa giới...</p>
            : error ? <p className="text-destructive">{error.message}</p>
                : data && <>
                    {version === "OLD" ? <>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 border-b pb-3">
                            <span><strong>{formatNumber(data.selected_count)}</strong> đơn vị cũ đã chọn</span>
                            <span><strong>{formatNumber(data.target_count)}</strong> xã/phường hiện tại liên quan</span>
                            <span className="text-emerald-800"><strong>{formatNumber(data.auto_count ?? 0)}</strong> có thể gán</span>
                            <span><strong>{formatNumber(data.already_count ?? 0)}</strong> đã đúng</span>
                            <span className="text-amber-800"><strong>{formatNumber((data.cross_count ?? 0) + (data.other_area_count ?? 0) + (data.mapping_issue_count ?? 0))}</strong> cần kiểm tra</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Tìm xã/phường, tỉnh, đơn vị cũ..." className="h-9 min-w-0 flex-1 bg-white sm:min-w-56" />
                            <Select value={decision} onValueChange={setDecision}>
                                <SelectTrigger className="h-9 w-[190px] bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả kết quả</SelectItem>
                                    {Object.entries(territoryDecisionLabels).map(([value, label]) =>
                                        <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="outline" size="sm" onClick={exportReport} title="Xuất danh sách đối chiếu">
                                <Download className="mr-2 h-4 w-4" />Xuất Excel
                            </Button>
                        </div>
                        <div className="max-h-[360px] overflow-auto rounded-md border bg-white">
                            <table className="w-full min-w-[900px] table-fixed text-left">
                                <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="w-[190px] px-3 py-2 font-semibold">Xã/Phường hiện tại</th>
                                        <th className="w-[285px] px-3 py-2 font-semibold">Đơn vị cũ cấu thành</th>
                                        <th className="w-[150px] px-3 py-2 font-semibold">Khu vực hiện tại</th>
                                        <th className="w-[145px] px-3 py-2 font-semibold">Khu vực dự kiến</th>
                                        <th className="w-[130px] px-3 py-2 font-semibold">Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {visibleTargets.map((item) => <tr key={item.id} className="align-top">
                                        <td className="px-3 py-2">
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.province_name}</div>
                                        </td>
                                        <td className="px-3 py-2"><OldConstituents items={item.old_constituents} /></td>
                                        <td className="px-3 py-2">{item.current_area_name ?? <span className="text-muted-foreground">Chưa gán</span>}</td>
                                        <td className="px-3 py-2">{targetAreaName}</td>
                                        <td className="px-3 py-2"><DecisionBadge decision={item.decision} /></td>
                                    </tr>)}
                                    {!visibleTargets.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Không có xã/phường phù hợp</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {(data.missing_count ?? 0) > 0 && <details className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                            <summary className="cursor-pointer font-medium text-amber-900">
                                {formatNumber(data.missing_count ?? 0)} đơn vị cũ chưa có ánh xạ
                            </summary>
                            <div className="mt-2 max-h-32 overflow-y-auto text-amber-900">
                                {(data.missing_old_units ?? []).map((item) =>
                                    <div key={item.id} className="py-0.5">{[item.name, item.parent_name, item.province_name].filter(Boolean).join(" / ")}</div>)}
                            </div>
                        </details>}
                        <p className="text-muted-foreground">
                            {formatNumber(data.affected_wards)} xã/phường đổi khu vực; {formatNumber(data.updated_units)} bản ghi cần cập nhật trực tiếp.
                        </p>
                    </> : <>
                        <p className="font-medium">{formatNumber(data.selected_count)} đơn vị đã chọn → {formatNumber(data.target_count)} đơn vị hiện tại</p>
                        <p>{formatNumber(data.affected_wards)} xã/phường sẽ đổi khu vực hiệu lực.
                            {data.preserved_overrides > 0 && ` ${formatNumber(data.preserved_overrides)} xã/phường gán riêng được giữ nguyên.`}</p>
                        <p>{formatNumber(data.updated_units)} đơn vị cần cập nhật trực tiếp.</p>
                        <div className="max-h-32 overflow-y-auto text-muted-foreground">
                            {(data.targets_preview ?? []).map((unit) => unit.name).join(", ")}
                            {data.target_count > (data.targets_preview?.length ?? 0) && "…"}
                        </div>
                    </>}
                </>}
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
            <Button type="button" disabled={!data || loading || saving || (version === "OLD"
                ? !data.auto_unit_ids?.length || data.updated_units === 0 : data.updated_units === 0)}
                onClick={onConfirm}>{saving ? "Đang lưu..." : version === "OLD"
                    ? `Gán ${formatNumber(data?.auto_count ?? 0)} xã/phường đủ điều kiện` : "Xác nhận gán"}</Button>
        </div>
    </section>
}

function OldConstituents({ items }: { items: TerritoryOldTarget["old_constituents"] }) {
    const renderItem = (item: TerritoryOldTarget["old_constituents"][number]) =>
        <div key={item.id} className={cn("py-0.5", !item.within_selection && "font-medium text-amber-800")}>
            {item.path}
            {!item.within_selection && <span className="ml-1 text-xs">(ngoài phạm vi)</span>}
            {!item.active && <span className="ml-1 text-xs">(ánh xạ ngưng)</span>}
        </div>
    return <div className="min-w-0">
        {items.slice(0, 2).map(renderItem)}
        {items.length > 2 && <details className="mt-1">
            <summary className="cursor-pointer text-primary">Xem thêm {items.length - 2} đơn vị</summary>
            {items.slice(2).map(renderItem)}
        </details>}
    </div>
}

function DecisionBadge({ decision }: { decision: TerritoryOldTarget["decision"] }) {
    return <Badge variant="outline" className={cn(
        "whitespace-nowrap",
        decision === "READY" && "border-emerald-300 bg-emerald-50 text-emerald-800",
        decision === "ALREADY" && "border-slate-200 bg-slate-50 text-slate-700",
        decision === "CROSS_BOUNDARY" && "border-amber-300 bg-amber-50 text-amber-900",
        decision === "OTHER_AREA" && "border-rose-300 bg-rose-50 text-rose-800",
        decision === "MAPPING_ISSUE" && "border-orange-300 bg-orange-50 text-orange-800",
    )}>{territoryDecisionLabels[decision]}</Badge>
}

function territoryOption(unit: AdministrativeUnit) {
    const parents = [unit.district?.name, unit.province?.name].filter(Boolean)
    return { value: unit.id, label: [unit.name, ...parents].join(" · ") }
}

function TerritoryList({ title, units, canUpdate, onRemove }: {
    title: string
    units: TerritoryUnit[]
    canUpdate: boolean
    onRemove: (id: number) => void
}) {
    return <section>
        <h3 className="mb-2 font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">({formatNumber(units.length)})</span></h3>
        {units.length ? <div className="max-h-48 divide-y overflow-y-auto border-y">
            {units.map((unit) => <div key={unit.id} className="flex min-h-10 items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate" title={unit.name}>{unit.name}{unit.province_name && <span className="text-muted-foreground"> · {unit.province_name}</span>}</span>
                {unit.level === "PROVINCE" && <span className="shrink-0 text-xs text-muted-foreground" title={`${unit.preserved_overrides ?? 0} xã/phường có khu vực riêng`}>
                    {formatNumber(unit.inherited_wards ?? 0)} xã/phường kế thừa
                </span>}
                {canUpdate && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
                    title="Bỏ gán địa bàn" aria-label={`Bỏ gán ${unit.name}`} onClick={() => onRemove(unit.id)}><Trash2 className="h-4 w-4" /></Button>}
            </div>)}
        </div> : <p className="text-sm text-muted-foreground">Chưa gán đơn vị nào</p>}
    </section>
}

function AreaDialog({ open, editing, form, setForm, onClose, onSave, saving }: {
    open: boolean
    editing: BusinessArea | null
    form: AreaForm
    setForm: (form: AreaForm) => void
    onClose: () => void
    onSave: () => void
    saving: boolean
}) {
    const isRegion = form.area_type === "REGION"
    const regionSource = useMemo(() => ({
        getList: ({ keyword }: { keyword?: string }) => listBusinessAreas({
            page: 1,
            size: 100,
            keyword,
            area_type: "REGION",
            status: 1,
        }),
        getById: getBusinessArea,
    }), [])

    const valid = form.code.trim() && form.name.trim() && (isRegion || form.parent_id != null)

    return <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>
                    {editing ? "Cập nhật" : "Thêm"} {isRegion ? "vùng quản lý" : "khu vực quản lý"}
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
                {!isRegion && <Field label="Thuộc vùng">
                    <AsyncSelect
                        value={form.parent_id}
                        onChange={(value: number | undefined) => setForm({ ...form, parent_id: value })}
                        dataSource={regionSource}
                        mapOption={(region: BusinessArea) => ({ value: region.id, label: `${region.code} - ${region.name}` })}
                        placeholder="Chọn vùng quản lý"
                        required
                    />
                </Field>}
                <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                    <Field label={isRegion ? "Mã vùng" : "Mã khu vực"}>
                        <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
                    </Field>
                    <Field label={isRegion ? "Tên vùng" : "Tên khu vực"}>
                        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </Field>
                </div>
                <Field label="Trạng thái">
                    <Select value={String(form.status)} onValueChange={(value) => setForm({ ...form, status: Number(value) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Hoạt động</SelectItem>
                            <SelectItem value="0">Ngưng</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Hủy</Button>
                <Button onClick={onSave} disabled={saving || !valid}>
                    {saving ? "Đang lưu..." : isRegion ? "Lưu vùng" : "Lưu khu vực"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}

function SummaryMetric({ icon: Icon, label, value }: {
    icon: typeof Layers3
    label: string
    value: number
}) {
    return <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sky-900 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/80 text-sky-700">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase text-sky-700">{label}</div>
                <div className="text-right text-xl font-semibold tabular-nums">{formatNumber(value)}</div>
            </div>
        </div>
    </div>
}

function StatusBadge({ status, compact = false }: { status: number; compact?: boolean }) {
    return status === 1
        ? <Badge className={cn("bg-emerald-100 text-emerald-800 hover:bg-emerald-100", compact && "h-5 px-1.5 text-[10px]")}>Hoạt động</Badge>
        : <Badge variant="secondary" className={cn(compact && "h-5 px-1.5 text-[10px]")}>Ngưng</Badge>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>
}

function FilterSelect({ value, onChange, items }: {
    value: string
    onChange: (value: string) => void
    items: string[][]
}) {
    return <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 min-w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
            {items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}
        </SelectContent>
    </Select>
}
