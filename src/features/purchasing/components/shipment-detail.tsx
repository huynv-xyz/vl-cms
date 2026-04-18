import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ShipmentDetail() {
    const [rows, setRows] = useState([
        { id: 1, code: "ZHP", remain: 50, input: 0 },
    ])

    const update = (id: number, val: number) => {
        setRows(prev =>
            prev.map(r => r.id === id ? { ...r, input: val } : r)
        )
    }

    const invalid = (r: any) => r.input > r.remain

    return (
        <div className="border p-4 mt-4 rounded">
            <h3 className="font-bold mb-2">Hàng trong lô</h3>

            <table className="w-full">
                <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Còn</th>
                        <th>Nhập</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map(r => (
                        <tr key={r.id}>
                            <td>{r.code}</td>
                            <td>{r.remain}</td>
                            <td>
                                <Input
                                    type="number"
                                    className={cn(invalid(r) && "border-red-500")}
                                    onChange={e => update(r.id, Number(e.target.value))}
                                />
                                {invalid(r) && (
                                    <div className="text-red-500 text-xs">
                                        Vượt SL
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Button className="mt-4">Lưu</Button>
        </div>
    )
}