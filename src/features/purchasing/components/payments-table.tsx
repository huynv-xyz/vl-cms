import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function PaymentsTable() {
    return (
        <div>
            <table className="w-full border">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Loại</th>
                        <th>Số tiền</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><Input type="date" /></td>
                        <td>
                            <select>
                                <option>CỌC</option>
                                <option>HÀNG</option>
                            </select>
                        </td>
                        <td><Input type="number" /></td>
                    </tr>
                </tbody>
            </table>

            <Button className="mt-2">Thêm</Button>
        </div>
    )
}