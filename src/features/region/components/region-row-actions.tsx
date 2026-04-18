import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useRegions } from "./regions-provider"
import type { Region } from "../data/schema"

export function RegionRowActions({ row }: { row: Row<Region> }) {
    const { openEdit } = useRegions()

    return <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} />
}