
import { buildTextColumn } from "@/components/crud/build-text-column"
import {
    buildMasterActionsColumn,
    buildMasterIndexColumn,
    masterCenterCell,
    masterGridCell,
    MasterOneLineText,
} from "@/components/master-data-columns"
import type { Province } from "../data/schema"
import { ProvinceRowActions } from "./province-row-actions"
import { ColumnDef } from "@tanstack/react-table"

export const provinceColumns: ColumnDef<Province>[] = [
    buildMasterIndexColumn<Province>(),
    buildTextColumn({
        accessorKey: "code",
        title: "Mã",
        width: 160,
        className: `w-[160px] ${masterCenterCell}`,
        render: (row) => (
            <MasterOneLineText value={row.code} className="text-center text-sm font-medium" />
        ),
    }),
    buildTextColumn({
        accessorKey: "name",
        title: "Tên",
        width: 320,
        className: `w-[320px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.name} className="text-sm font-medium" />,
    }),
    buildTextColumn({
        accessorKey: "region_id",
        title: "Vùng",
        width: 160,
        className: `w-[160px] ${masterCenterCell}`,
        render: (row) => <MasterOneLineText value={row.region_id} className="text-center text-sm" />,
    }),

    buildMasterActionsColumn({
        renderActions: (_, row) => <ProvinceRowActions row={row} />,
    }),
]
