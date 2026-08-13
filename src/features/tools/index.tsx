import { Link } from "@tanstack/react-router"
import { ArrowRight, Boxes, DatabaseZap, PackageCheck } from "lucide-react"

import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ToolItem = {
    title: string
    description: string
    url: string
    status: "Tạm thời" | "Bảo trì dữ liệu"
    icon: typeof PackageCheck
}

const tools: ToolItem[] = [
    {
        title: "Backfill liên kết chi tiết lô hàng",
        description:
            "Gán shipment_items.contract_item_id từ dữ liệu hợp đồng cũ, chỉ chạy khi dữ liệu khớp rõ ràng.",
        url: "/tools/purchasing-shipment-contract-item-backfill",
        status: "Bảo trì dữ liệu",
        icon: PackageCheck,
    },
    {
        title: "Merge mã sản phẩm",
        description:
            "Gộp phát sinh từ mã sản phẩm cũ sang mã mới và kiểm tra lại dữ liệu sau khi chạy.",
        url: "/tools/product-merge",
        status: "Bảo trì dữ liệu",
        icon: Boxes,
    },
    {
        title: "Rollback kho phiếu xuất",
        description:
            "Rà và rollback phần kho của phiếu xuất nghi bị ghi kho trùng với dữ liệu tồn cũ/import.",
        url: "/tools/sales-export-inventory-rollback",
        status: "Tạm thời",
        icon: DatabaseZap,
    },
]

export default function ToolsPage() {
    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="space-y-2 border-b pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Công cụ quản trị dữ liệu</h2>
                        <p className="text-muted-foreground text-sm">
                            Danh sách các tool nội bộ đang có. Các trang trong nhóm này chỉ dành cho quyền admin.
                        </p>
                    </div>
                    <Badge variant="destructive">Admin only</Badge>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {tools.map((tool) => {
                    const Icon = tool.icon

                    return (
                        <Card key={tool.url} className="flex flex-col">
                            <CardHeader className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="rounded-md border bg-muted/30 p-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <Badge variant="secondary">{tool.status}</Badge>
                                </div>
                                <CardTitle className="text-base">{tool.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col gap-4">
                                <p className="text-muted-foreground min-h-12 text-sm">{tool.description}</p>
                                <div className="text-muted-foreground rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs">
                                    {tool.url}
                                </div>
                                <Button asChild className="mt-auto w-full">
                                    <Link to={tool.url}>
                                        Mở tool
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </Main>
    )
}
