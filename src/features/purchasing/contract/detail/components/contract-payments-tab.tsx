import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ContractPaymentsTab() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Thanh toán</CardTitle>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm thanh toán
                </Button>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    Chưa triển khai danh sách thanh toán.
                </div>
            </CardContent>
        </Card>
    )
}