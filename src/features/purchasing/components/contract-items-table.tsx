import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ContractItemsTable() {
    return (
        <div>
            <table className="w-full border">
                <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Tên</th>
                        <th>SL</th>
                        <th>Giá</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>ZHP</td>
                        <td>NPK</td>
                        <td><Input type="number" defaultValue={100} /></td>
                        <td><Input type="number" defaultValue={1900} /></td>
                    </tr>
                </tbody>
            </table>

            <Button className="mt-2">Thêm</Button>
        </div>
    )
}