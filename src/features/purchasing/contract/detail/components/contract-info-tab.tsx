import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ContractInfoTab({ contract }: { contract: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Thông tin hợp đồng</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Mã hợp đồng" value={contract.code} />
                <InfoItem label="Nhà cung cấp" value={contract.supplier?.name ?? contract.supplier_name} />
                <InfoItem label="Ngày ký" value={contract.signed_at} />
                <InfoItem label="Ngày hiệu lực" value={contract.effective_at} />
                <InfoItem label="Ngày hết hạn" value={contract.expired_at} />
                <InfoItem label="Trạng thái" value={contract.status_text ?? contract.status} />
                <InfoItem label="Người tạo" value={contract.created_by} />
                <InfoItem label="Ngày tạo" value={contract.created_at} />
                <InfoItem label="Ngày cập nhật" value={contract.updated_at} />
            </CardContent>
        </Card>
    )
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium">{value ?? "-"}</div>
        </div>
    )
}