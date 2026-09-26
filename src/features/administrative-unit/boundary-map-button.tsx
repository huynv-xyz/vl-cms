import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Map as MapIcon, Loader2 } from "lucide-react"
import type { Map, GeoJSONSource } from "maplibre-gl"
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"

import {
    downloadAdministrativeBoundaryFile,
    getAdministrativeMapTerritory,
    listAdministrativeBoundaryFiles,
    type AdministrativeBoundaryFile,
} from "@/api/geography"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type View = "OLD" | "CURRENT"
type Level = "province" | "detail"
type BoundaryFeature = {
    type: "Feature"
    properties: { code: string; name: string }
    geometry: { coordinates: unknown }
}
type BoundaryCollection = { type: "FeatureCollection"; features: BoundaryFeature[] }

function boundsOf(features: BoundaryFeature[]): [[number, number], [number, number]] | null {
    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity
    const visit = (value: unknown) => {
        if (!Array.isArray(value)) return
        if (typeof value[0] === "number" && typeof value[1] === "number") {
            west = Math.min(west, value[0])
            south = Math.min(south, value[1])
            east = Math.max(east, value[0])
            north = Math.max(north, value[1])
        } else {
            value.forEach(visit)
        }
    }
    features.forEach((feature) => visit(feature.geometry.coordinates))
    return Number.isFinite(west) ? [[west, south], [east, north]] : null
}

export function BoundaryMapButton({ initialView }: { initialView: View }) {
    const [open, setOpen] = useState(false)
    return <>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <MapIcon className="h-4 w-4" /> Xem bản đồ
        </Button>
        {open && <BoundaryMapDialog initialView={initialView} onClose={() => setOpen(false)} />}
    </>
}

function BoundaryMapDialog({ initialView, onClose }: { initialView: View; onClose: () => void }) {
    const [view, setView] = useState<View>(initialView)
    const [level, setLevel] = useState<Level>("province")
    const [province, setProvince] = useState("all")
    const [regionId, setRegionId] = useState("all")
    const [areaId, setAreaId] = useState("all")
    const [mapReady, setMapReady] = useState(false)
    const [maplibre, setMaplibre] = useState<typeof import("maplibre-gl") | null>(null)
    const [mapError, setMapError] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<Map | null>(null)
    const filesQuery = useQuery({ queryKey: ["administrative-boundary-files"], queryFn: listAdministrativeBoundaryFiles })
    const hasTerritoryFilter = regionId !== "all" || areaId !== "all"
    const territoryLevel = level === "province" ? "PROVINCE" : view === "OLD" ? "DISTRICT" : "WARD"
    const territoryQuery = useQuery({
        queryKey: ["administrative-map-territory", view, territoryLevel, regionId, areaId],
        queryFn: () => getAdministrativeMapTerritory(view, territoryLevel,
            regionId === "all" ? undefined : Number(regionId),
            areaId === "all" ? undefined : Number(areaId)),
        placeholderData: (previous) => previous,
    })
    const areas = territoryQuery.data?.areas ?? []
    const regions = areas.filter((area) => area.area_type === "REGION")
    const areaOptions = areas.filter((area) => area.area_type === "AREA"
        && (regionId === "all" || String(area.parent_id) === regionId))
    const prefix = view === "OLD" ? "old_districts" : "current_wards"
    const files = filesQuery.data ?? []
    const provinceFile = files.find((file) => file.file_name === `${view.toLowerCase()}_provinces.geojson`)
    const detailFiles = useMemo(() => files.filter((file) =>
        new RegExp(`^${prefix}_[0-9]{2}\\.geojson$`).test(file.file_name),
    ), [files, prefix])
    const selectedFile = level === "province" ? provinceFile : files.find((file) =>
        file.file_name === `${prefix}_${province === "all" ? "overview" : province}.geojson`,
    )
    const dataQuery = useQuery({
        queryKey: ["administrative-boundary-geojson", selectedFile?.file_name],
        queryFn: async (): Promise<BoundaryCollection> => {
            const blob = await downloadAdministrativeBoundaryFile(selectedFile!.file_name)
            const data: unknown = JSON.parse(await blob.text())
            if (!data || typeof data !== "object" || (data as BoundaryCollection).type !== "FeatureCollection"
                || !Array.isArray((data as BoundaryCollection).features)) {
                throw new Error("File ranh giới không phải GeoJSON hợp lệ")
            }
            return data as BoundaryCollection
        },
        enabled: !!selectedFile,
        gcTime: 60_000,
    })
    const visibleFeatures = useMemo(() => {
        const features = dataQuery.data?.features ?? []
        if (!hasTerritoryFilter) return features
        const codes = new Set(territoryQuery.data?.codes ?? [])
        return features.filter((feature) => codes.has(feature.properties.code))
    }, [dataQuery.data, hasTerritoryFilter, territoryQuery.data?.codes])

    useEffect(() => {
        let active = true
        Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")])
            .then(([library]) => {
                if (!active) return
                library.setWorkerUrl(workerUrl)
                setMaplibre(library)
            })
            .catch(() => { if (active) setMapError("Không khởi tạo được thư viện bản đồ") })
        return () => { active = false }
    }, [])

    useEffect(() => {
        if (!maplibre) return
        if (!containerRef.current) return
        const map = new maplibre.Map({
            container: containerRef.current,
            style: {
                version: 8,
                sources: {},
                layers: [{ id: "background", type: "background", paint: { "background-color": "#eef4f4" } }],
            },
            center: [107, 16],
            zoom: 4,
            attributionControl: false,
        })
        mapRef.current = map
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right")
        map.on("load", () => {
            setMapReady(true)
            map.resize()
        })
        map.on("click", "boundary-fill", (event) => {
            const feature = event.features?.[0]
            if (!feature) return
            map.setFilter("boundary-selected", ["==", ["get", "code"], String(feature.properties?.code ?? "")])
            new maplibre.Popup({ closeButton: false }).setLngLat(event.lngLat)
                .setText(String(feature.properties?.name ?? "")).addTo(map)
        })
        map.on("mouseenter", "boundary-fill", () => { map.getCanvas().style.cursor = "pointer" })
        map.on("mouseleave", "boundary-fill", () => { map.getCanvas().style.cursor = "" })
        const resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(containerRef.current)
        return () => {
            resizeObserver.disconnect()
            mapRef.current = null
            map.remove()
        }
    }, [maplibre])

    useEffect(() => {
        const map = mapRef.current
        const data = dataQuery.data
        if (!mapReady || !map || !data || territoryQuery.isFetching || territoryQuery.isError) return
        const displayedData = { ...data, features: visibleFeatures }
        const source = map.getSource("boundaries") as GeoJSONSource | undefined
        if (source) {
            source.setData(displayedData as Parameters<GeoJSONSource["setData"]>[0])
            map.setFilter("boundary-selected", ["==", ["get", "code"], ""])
        } else {
            map.addSource("boundaries", { type: "geojson", data: displayedData as Parameters<GeoJSONSource["setData"]>[0] })
            map.addLayer({ id: "boundary-fill", type: "fill", source: "boundaries", paint: {
                "fill-color": "#75bbb3", "fill-opacity": 0.76,
            } })
            map.addLayer({ id: "boundary-line", type: "line", source: "boundaries", paint: {
                "line-color": "#28736e", "line-width": 1,
            } })
            map.addLayer({ id: "boundary-selected", type: "line", source: "boundaries",
                filter: ["==", ["get", "code"], ""], paint: { "line-color": "#d97706", "line-width": 3 } })
        }
        const focus = level === "province" && province !== "all"
            ? visibleFeatures.filter((feature) => feature.properties.code === province)
            : visibleFeatures
        const bounds = boundsOf(focus.length ? focus : visibleFeatures)
        if (bounds) map.fitBounds(bounds, { padding: 36, maxZoom: 11, duration: 350 })
    }, [dataQuery.data, level, mapReady, province, territoryQuery.isFetching, territoryQuery.isError, visibleFeatures])

    const changeView = (next: View) => {
        setView(next)
        setProvince("all")
    }
    const detailTitle = view === "OLD" ? "Huyện/Quận" : "Xã/Phường"

    return <Dialog open onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="flex h-[94dvh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]">
            <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
                <DialogTitle>Bản đồ địa giới hành chính</DialogTitle>
            </DialogHeader>
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-5 py-3">
                <Tabs value={view} onValueChange={(value) => changeView(value as View)}>
                    <TabsList>
                        <TabsTrigger value="CURRENT">Địa giới hiện tại</TabsTrigger>
                        <TabsTrigger value="OLD">Địa giới cũ</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Tabs value={level} onValueChange={(value) => setLevel(value as Level)}>
                    <TabsList>
                        <TabsTrigger value="province">Tỉnh/Thành phố</TabsTrigger>
                        <TabsTrigger value="detail">{detailTitle}</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Select value={province} onValueChange={(value) => { setProvince(value); if (value !== "all") setLevel("detail") }}>
                    <SelectTrigger className="min-w-44 max-w-64"><SelectValue placeholder="Chọn tỉnh/thành phố" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toàn quốc</SelectItem>
                        {detailFiles.map((file: AdministrativeBoundaryFile) => {
                            const code = file.file_name.match(/_(\d{2})\.geojson$/)?.[1]
                            return code && <SelectItem key={code} value={code}>{file.province_name ?? `Tỉnh ${code}`}</SelectItem>
                        })}
                    </SelectContent>
                </Select>
                <Select value={regionId} onValueChange={(value) => { setRegionId(value); setAreaId("all") }}>
                    <SelectTrigger className="min-w-40 max-w-56" aria-label="Lọc vùng quản lý"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả vùng</SelectItem>
                        {regions.map((region) => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={areaId} onValueChange={(value) => {
                    setAreaId(value)
                    if (value !== "all") {
                        const selected = areaOptions.find((area) => String(area.id) === value)
                        if (selected?.parent_id != null) setRegionId(String(selected.parent_id))
                    }
                }}>
                    <SelectTrigger className="min-w-44 max-w-64" aria-label="Lọc khu vực quản lý"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả khu vực</SelectItem>
                        {areaOptions.map((area) => <SelectItem key={area.id} value={String(area.id)}>
                            {area.name}{regionId === "all" ? ` · ${regions.find((region) => region.id === area.parent_id)?.name ?? ""}` : ""}
                        </SelectItem>)}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                    {territoryQuery.isFetching ? "…" : visibleFeatures.length.toLocaleString("vi-VN")} đơn vị
                </span>
                {hasTerritoryFilter && (level === "province" || view === "OLD") && <span className="text-xs text-muted-foreground">
                    Có phần địa bàn thuộc phân vùng; ranh giới không được cắt theo khu vực.
                </span>}
            </div>
            <div className="relative min-h-0 flex-1">
                <div ref={containerRef} className="h-full w-full" />
                {(!maplibre || !mapReady || filesQuery.isLoading || (!!selectedFile && dataQuery.isLoading) || territoryQuery.isFetching) && !mapError && !territoryQuery.isError && <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/70 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang lọc bản đồ...
                </div>}
                {(mapError || filesQuery.isError || dataQuery.isError || territoryQuery.isError || (!filesQuery.isLoading && !selectedFile) || (hasTerritoryFilter && !!dataQuery.data && !territoryQuery.isFetching && visibleFeatures.length === 0)) && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 px-6 text-center text-sm text-muted-foreground">
                    {mapError ?? (filesQuery.isError ? "Không đọc được danh sách file ranh giới"
                        : dataQuery.isError ? (dataQuery.error instanceof Error ? dataQuery.error.message : "Không tải được GeoJSON")
                        : territoryQuery.isError ? (territoryQuery.error instanceof Error ? territoryQuery.error.message : "Không lọc được phân vùng quản lý")
                        : hasTerritoryFilter && selectedFile && visibleFeatures.length === 0 ? "Không có địa giới nào thuộc phân vùng đã chọn trong lớp bản đồ này"
                        : `Chưa có file ${level === "province" ? "tỉnh/thành phố" : province === "all" ? "tổng quan" : "chi tiết tỉnh"} cho góc nhìn này. Tải lên trong File ranh giới.`)}
                </div>}
            </div>
        </DialogContent>
    </Dialog>
}
