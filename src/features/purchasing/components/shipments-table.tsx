import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShipmentDetail } from "./shipment-detail"

export function ShipmentsTable() {
    const [open, setOpen] = useState(false)

    return (
        <div>
            <table className="w-full border">
                <thead>
                    <tr>
                        <th>Số lô</th>
                        <th>ETA</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>VL18</td>
                        <td>25/01/2026</td>
                        <td>Đã về</td>
                        <td>
                            <Button size="sm" onClick={() => setOpen(true)}>
                                Chi tiết
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <Button className="mt-2">Tạo lô</Button>

            {open && <ShipmentDetail />}
        </div>
    )
}