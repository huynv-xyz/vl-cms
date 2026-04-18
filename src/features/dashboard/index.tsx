import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Main } from "@/components/layout/main"

export function Dashboard() {
    return (
        <Main className="space-y-8">
            {/* Welcome */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back 👋
                </h1>
                <p className="text-muted-foreground">
                    VLife Admin.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
                    <CardHeader>
                        <CardTitle className="text-base">Quản lý Users</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Xem danh sách users, trạng thái và thông tin chi tiết.
                    </CardContent>
                </Card>
            </div>
        </Main>
    )
}
