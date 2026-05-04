import { Card, CardContent } from "@/components/ui/card"
import { Export } from "../../export/data/schema"

type Props = {
    data: Export
}

export function ExportInfo({ data }: Props) {
    return (
        <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">

                <div>
                    <div className="text-muted-foreground">Số phiếu</div>
                    <div className="font-medium">{data.export_no}</div>
                </div>

                <div>
                    <div className="text-muted-foreground">Ngày xuất</div>
                    <div className="font-medium">{data.export_date}</div>
                </div>

                <div>
                    <div className="text-muted-foreground">Kho</div>
                    <div className="font-medium">
                        {data.warehouse?.name ?? "-"}
                    </div>
                </div>

                <div>
                    <div className="text-muted-foreground">Trạng thái</div>
                    <div className="font-medium">
                        {data.status}
                    </div>
                </div>

                <div>
                    <div className="text-muted-foreground">Đơn hàng</div>
                    <div className="font-medium">
                        {data.order?.order_no}
                    </div>
                </div>

                <div>
                    <div className="text-muted-foreground">Mã giao hàng</div>
                    <div className="font-medium">
                        {data.delivery?.delivery_no}
                    </div>
                </div>

                <div>
                    <div className="text-muted-foreground">Ghi chú</div>
                    <div className="font-medium">
                        {data.note || "-"}
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}