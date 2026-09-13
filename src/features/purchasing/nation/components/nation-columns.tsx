import type { ColumnDef } from "@tanstack/react-table"
import { buildTextColumn } from "@/components/crud/build-text-column"
import {
    buildMasterActionsColumn,
    buildMasterIndexColumn,
    masterCenterCell,
    masterGridCell,
    MasterOneLineText,
} from "@/components/master-data-columns"
import type { Nation } from "../data/schema"
import { NationRowActions } from "./nation-row-actions"

export const nationColumns: ColumnDef<Nation>[] = [
    buildMasterIndexColumn<Nation>(),

    buildTextColumn<Nation>({
        accessorKey: "code",
        title: "Mã quốc gia",
        width: 180,
        className: `w-[180px] ${masterCenterCell}`,
        render: (row) => (
            <MasterOneLineText value={row.code} className="text-center text-sm font-medium" />
        ),
    }),

    buildTextColumn<Nation>({
        accessorKey: "name",
        title: "Tên quốc gia",
        width: 360,
        className: `w-[360px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.name} className="text-sm font-medium" />,
    }),

    buildTextColumn<Nation>({
        accessorKey: "created_at",
        title: "Ngày tạo",
        width: 180,
        className: `w-[180px] ${masterCenterCell}`,
        render: (row) => <MasterOneLineText value={row.created_at} className="text-center text-sm" />,
    }),

    buildMasterActionsColumn<Nation>({
        renderActions: (_, row) => <NationRowActions row={row} />,
    }),
]
