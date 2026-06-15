import { CrudTable } from "@/components/crud/crud-table"
import type { PhysicalWarehouse } from "../data/schema"
import { physicalWarehouseColumns } from "./physical-warehouse-columns"

export function PhysicalWarehouseTable(props: any) {
    return (
        <CrudTable<PhysicalWarehouse>
            {...props}
            columns={physicalWarehouseColumns}
            entityName="kho vật lý"
            searchPlaceholder="Tìm theo mã hoặc tên kho vật lý..."
            filters={[
                {
                    columnId: "status",
                    title: "Trạng thái",
                    values: props.status,
                    onChange: props.onStatusChange,
                    options: [
                        { label: "Hoạt động", value: "ACTIVE" },
                        { label: "Ngừng", value: "INACTIVE" },
                    ],
                },
            ]}
        />
    )
}
