import { useQueryClient } from "@tanstack/react-query"
import type { Row } from "@tanstack/react-table"
import { toast } from "sonner"

import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { deletePhysicalWarehouse } from "@/api/physical-warehouse"
import { usePhysicalWarehouses } from "./physical-warehouses-provider"
import type { PhysicalWarehouse } from "../data/schema"

export function PhysicalWarehouseRowActions({
    row,
}: {
    row: Row<PhysicalWarehouse>
}) {
    const queryClient = useQueryClient()
    const { openEdit } = usePhysicalWarehouses()

    return (
        <CrudRowActions
            row={row.original}
            onEdit={() => openEdit(row.original)}
            onDelete={async (physicalWarehouse) => {
                await deletePhysicalWarehouse(physicalWarehouse.id)
                toast.success("Đã xóa kho vật lý")
                await queryClient.invalidateQueries({
                    queryKey: ["physical-warehouse"],
                })
                await queryClient.invalidateQueries({ queryKey: ["warehouse"] })
            }}
        />
    )
}
