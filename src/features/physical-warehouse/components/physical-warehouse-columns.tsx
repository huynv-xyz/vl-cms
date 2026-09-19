import type { ColumnDef } from "@tanstack/react-table"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import {
    buildMasterActionsColumn,
    buildMasterIndexColumn,
    masterCenterCell,
    masterGridCell,
    MasterOneLineText,
} from "@/components/master-data-columns"
import type { PhysicalWarehouse } from "../data/schema"
import { PhysicalWarehouseRowActions } from "./physical-warehouse-row-actions"

export const physicalWarehouseColumns: ColumnDef<PhysicalWarehouse>[] = [
    buildMasterIndexColumn<PhysicalWarehouse>(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã địa điểm kho",
        width: 180,
        className: `w-[180px] ${masterCenterCell}`,
        render: (row) => (
            <MasterOneLineText value={row.code} className="text-center text-sm font-medium" />
        ),
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên địa điểm kho",
        width: 260,
        className: `w-[260px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.name} className="text-sm font-medium" />,
    }),

    buildTextColumn({
        accessorKey: "address",
        title: "Địa chỉ",
        width: 360,
        className: `w-[360px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.address} className="text-sm" />,
    }),

    {
        ...buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
            width: 140,
        mapValueToLabel: (v) => (v === "ACTIVE" ? "Hoạt động" : "Ngừng"),
        }),
        meta: {
            thClassName: `w-[140px] whitespace-nowrap ${masterCenterCell}`,
            tdClassName: `w-[140px] whitespace-nowrap ${masterCenterCell}`,
        },
    },

    buildTextColumn({
        accessorKey: "note",
        title: "Ghi chú",
        width: 280,
        className: `w-[280px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.note} className="text-sm" />,
    }),

    buildMasterActionsColumn({
        renderActions: (_, row) => <PhysicalWarehouseRowActions row={row} />,
    }),
]
