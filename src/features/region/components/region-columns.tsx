import { ColumnDef } from "@tanstack/react-table"
import { buildTextColumn } from "@/components/crud/build-text-column"
import {
    buildMasterActionsColumn,
    buildMasterIndexColumn,
    masterCenterCell,
    masterGridCell,
    MasterOneLineText,
} from "@/components/master-data-columns"
import type { Region } from "../data/schema"
import { RegionRowActions } from "./region-row-actions"

export const regionColumns: ColumnDef<Region>[] = [
    buildMasterIndexColumn<Region>(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã vùng",
        width: 180,
        className: `w-[180px] ${masterCenterCell}`,
        render: (row) => (
            <MasterOneLineText value={row.code} className="text-center text-sm font-medium" />
        ),
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên vùng",
        width: 360,
        className: `w-[360px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.name} className="text-sm font-medium" />,
    }),

    buildMasterActionsColumn({
        renderActions: (_, row) => <RegionRowActions row={row} />,
    }),
]
