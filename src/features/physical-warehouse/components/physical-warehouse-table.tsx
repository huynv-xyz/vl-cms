import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Warehouse } from "lucide-react"

import { MasterDataReportTable } from "@/components/master-data-report-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { PhysicalWarehouse } from "../data/schema"
import { physicalWarehouseColumns } from "./physical-warehouse-columns"

type PhysicalWarehouseTableProps = {
    data: PhysicalWarehouse[]
    summaryValue?: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    status: string[]
    onStatusChange: (value: string[]) => void
}

export function PhysicalWarehouseTable({
    data,
    summaryValue,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    status,
    onStatusChange,
}: PhysicalWarehouseTableProps) {
    return (
        <MasterDataReportTable<PhysicalWarehouse>
            data={data}
            columns={physicalWarehouseColumns}
            entityName="địa điểm kho"
            summaryLabel="Tổng địa điểm kho"
            summaryValue={summaryValue}
            icon={Warehouse}
            searchPlaceholder="Tìm theo mã hoặc tên địa điểm kho..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={
                <Select
                    value={status[0] ?? "all"}
                    onValueChange={(value) =>
                        onStatusChange(value === "all" ? [] : [value])
                    }
                >
                    <SelectTrigger className="h-10 min-w-[150px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Ngừng</SelectItem>
                    </SelectContent>
                </Select>
            }
        />
    )
}
