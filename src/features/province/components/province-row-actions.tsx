import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useProvinces } from "./provinces-provider"
import type { Province } from "../data/schema"

export function ProvinceRowActions({ row }: { row: Row<Province> }) {
    const { openEdit } = useProvinces()

    return (
        <CrudRowActions onEdit={() => openEdit(row.original)} />
    )
}