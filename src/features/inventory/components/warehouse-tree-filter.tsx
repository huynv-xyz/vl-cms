import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Warehouse } from "lucide-react"

import { listPhysicalWarehouses } from "@/api/physical-warehouse"
import { listWarehouses } from "@/api/warehouse"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type WarehouseTreeFilterProps = {
    value: number[]
    onChange: (value: number[]) => void
    className?: string
}

export function WarehouseTreeFilter({ value, onChange, className }: WarehouseTreeFilterProps) {
    const [open, setOpen] = useState(false)
    const [draftValue, setDraftValue] = useState<number[]>(value)
    const [warehouseKeyword, setWarehouseKeyword] = useState("")
    const [activePhysicalId, setActivePhysicalId] = useState<number>()
    const selected = useMemo(() => new Set(draftValue), [draftValue])
    const appliedSelected = useMemo(() => new Set(value), [value])

    useEffect(() => {
        if (open) {
            setDraftValue(value)
            setWarehouseKeyword("")
            setActivePhysicalId(undefined)
        }
    }, [open, value])

    const { data: physicalData, isLoading: loadingPhysical } = useQuery({
        queryKey: ["inventory-warehouse-filter-physical-warehouses"],
        queryFn: () => listPhysicalWarehouses({ page: 1, size: 500, status: "ACTIVE" }),
    })
    const { data: warehouseData, isLoading: loadingWarehouses } = useQuery({
        queryKey: ["inventory-warehouse-filter-warehouses"],
        queryFn: () => listWarehouses({ page: 1, size: 1000, status: "ACTIVE" }),
    })

    const physicalWarehouses = physicalData?.items || []
    const warehouses = warehouseData?.items || []
    const warehousesByPhysical = useMemo(() => {
        const map = new Map<number, any[]>()
        for (const warehouse of warehouses) {
            const physicalId = Number(warehouse.physical_warehouse_id || 0)
            if (!map.has(physicalId)) map.set(physicalId, [])
            map.get(physicalId)!.push(warehouse)
        }
        return map
    }, [warehouses])

    const selectedWarehouses = useMemo(
        () => warehouses.filter((warehouse: any) => appliedSelected.has(Number(warehouse.id))),
        [warehouses, appliedSelected],
    )
    const triggerLabel = selectedWarehouses.length
        ? selectedWarehouses.length <= 2
            ? selectedWarehouses.map((warehouse: any) => warehouse.name).join(", ")
            : `${selectedWarehouses.length} kho đã chọn`
        : "Chọn kho"

    const setSelected = (ids: number[]) => {
        setDraftValue(Array.from(new Set(ids)).sort((a, b) => a - b))
    }

    const togglePhysical = (physicalId: number) => {
        const childIds = (warehousesByPhysical.get(physicalId) || []).map((warehouse: any) => Number(warehouse.id))
        if (!childIds.length) return

        const allSelected = childIds.every((id) => selected.has(id))
        if (allSelected) {
            setSelected(draftValue.filter((id) => !childIds.includes(id)))
            return
        }
        setSelected([...draftValue, ...childIds])
    }

    const toggleWarehouse = (warehouseId: number) => {
        if (selected.has(warehouseId)) {
            setSelected(draftValue.filter((id) => id !== warehouseId))
            return
        }
        setSelected([...draftValue, warehouseId])
    }

    const scopedWarehouses = useMemo(() => {
        if (!activePhysicalId) return warehouses
        return warehouses.filter((warehouse: any) => Number(warehouse.physical_warehouse_id || 0) === activePhysicalId)
    }, [activePhysicalId, warehouses])

    const filteredWarehouses = useMemo(() => {
        const keyword = warehouseKeyword.trim().toLowerCase()
        if (!keyword) return scopedWarehouses
        return scopedWarehouses.filter((warehouse: any) => {
            const text = `${warehouse.code || ""} ${warehouse.name || ""}`.toLowerCase()
            return text.includes(keyword)
        })
    }, [scopedWarehouses, warehouseKeyword])

    const allWarehouseIds = useMemo(() => warehouses.map((warehouse: any) => Number(warehouse.id)), [warehouses])
    const filteredWarehouseIds = useMemo(() => filteredWarehouses.map((warehouse: any) => Number(warehouse.id)), [filteredWarehouses])
    const selectedAllCount = allWarehouseIds.filter((id) => selected.has(id)).length
    const selectedFilteredCount = filteredWarehouseIds.filter((id) => selected.has(id)).length
    const allPhysicalChecked = selectedAllCount === 0 ? false : selectedAllCount === allWarehouseIds.length ? true : "indeterminate"
    const filteredWarehousesChecked = selectedFilteredCount === 0 ? false : selectedFilteredCount === filteredWarehouseIds.length ? true : "indeterminate"

    const toggleAllWarehouses = (ids: number[]) => {
        if (!ids.length) return
        const allSelected = ids.every((id) => selected.has(id))
        if (allSelected) {
            setSelected(draftValue.filter((id) => !ids.includes(id)))
            return
        }
        setSelected([...draftValue, ...ids])
    }

    const loading = loadingPhysical || loadingWarehouses

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn("min-w-[240px] justify-start overflow-hidden px-3 text-left font-normal", className)}
                >
                    <Warehouse className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{triggerLabel}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[720px] max-w-[calc(100vw-32px)] p-0">
                <div className="grid max-h-[420px] grid-cols-[260px_1fr] overflow-hidden">
                    <div className="border-r bg-muted/30">
                        <div className="border-b px-3 py-2 text-sm font-semibold">Địa điểm kho</div>
                        <label className="mx-2 mt-2 flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-white">
                            <Checkbox
                                checked={allPhysicalChecked}
                                disabled={!allWarehouseIds.length}
                                onCheckedChange={() => toggleAllWarehouses(allWarehouseIds)}
                                className="mt-0.5"
                            />
                            <span className="min-w-0">
                                <span className="block truncate font-medium">Chọn tất cả</span>
                                <span className="text-xs text-muted-foreground">{selectedAllCount}/{allWarehouseIds.length} kho</span>
                            </span>
                        </label>
                        <div className="max-h-[318px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Đang tải...</div>
                            ) : physicalWarehouses.length ? (
                                physicalWarehouses.map((physical: any) => {
                                    const physicalId = Number(physical.id)
                                    const childIds = (warehousesByPhysical.get(physicalId) || []).map((warehouse: any) => Number(warehouse.id))
                                    const checkedCount = childIds.filter((id) => selected.has(id)).length
                                    const checked = checkedCount === 0 ? false : checkedCount === childIds.length ? true : "indeterminate"
                                    return (
                                        <button
                                            key={physical.id}
                                            type="button"
                                            className={cn(
                                                "flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-white",
                                                activePhysicalId === physicalId && "bg-white shadow-sm",
                                            )}
                                            onClick={() => {
                                                setActivePhysicalId(physicalId)
                                                setWarehouseKeyword("")
                                            }}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                disabled={!childIds.length}
                                                onClick={(event) => event.stopPropagation()}
                                                onCheckedChange={() => togglePhysical(physicalId)}
                                                className="mt-0.5"
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{physical.name}</span>
                                                <span className="text-xs text-muted-foreground">{checkedCount}/{childIds.length} kho</span>
                                            </span>
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Chưa có địa điểm kho.</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="space-y-2 border-b px-3 py-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold">Kho</div>
                                {draftValue.length ? (
                                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelected([])}>
                                        Xóa chọn
                                    </Button>
                                ) : null}
                            </div>
                            <Input
                                value={warehouseKeyword}
                                onChange={(event) => setWarehouseKeyword(event.target.value)}
                                placeholder="Tìm kho"
                                className="h-9"
                            />
                            <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/50">
                                <Checkbox
                                    checked={filteredWarehousesChecked}
                                    disabled={!filteredWarehouseIds.length}
                                    onCheckedChange={() => toggleAllWarehouses(filteredWarehouseIds)}
                                />
                                <span className="min-w-0 flex-1 truncate font-medium">Chọn tất cả kết quả</span>
                                <span className="text-xs text-muted-foreground">{selectedFilteredCount}/{filteredWarehouseIds.length}</span>
                            </label>
                        </div>
                        <div className="max-h-[318px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Đang tải...</div>
                            ) : filteredWarehouses.length ? (
                                filteredWarehouses.map((warehouse: any) => {
                                    const physical = physicalWarehouses.find((item: any) => Number(item.id) === Number(warehouse.physical_warehouse_id))
                                    return (
                                        <label key={warehouse.id} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50">
                                            <Checkbox
                                                checked={selected.has(Number(warehouse.id))}
                                                onCheckedChange={() => toggleWarehouse(Number(warehouse.id))}
                                                className="mt-0.5"
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{warehouse.name}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{physical?.name || "Chưa gắn địa điểm kho"}</span>
                                            </span>
                                        </label>
                                    )
                                })
                            ) : (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Chưa có kho.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between border-t px-3 py-2">
                    <div className="text-xs text-muted-foreground">{draftValue.length ? `${draftValue.length} kho đang chọn` : "Chưa chọn kho"}</div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setDraftValue(value)
                                setOpen(false)
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                onChange(draftValue)
                                setOpen(false)
                            }}
                        >
                            Áp dụng
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
