import { useQuery } from "@tanstack/react-query"
import { getExport } from "@/api/sale/export"
import { ExportInfo } from "./components/export-info"
import { ExportItems } from "./components/export-items"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export default function ExportDetailPage({ id }: { id: number }) {
    const query: any = useQuery({
        queryKey: ["export-detail", id],
        queryFn: () => getExport(id),
        enabled: Number.isFinite(id) && id > 0,
    })

    const data: any = query.data?.data ?? query.data

    return (
        <PageSection
            isLoading={query.isLoading}
            error={query.error}
            data={data}
            title="Phiếu xuất bán"
            showBack
            actions={
                <Button variant="outline" size="sm" asChild>
                    <a href={`/inventory/vouchers?keyword=${encodeURIComponent(data?.export_no || "")}`} target="_blank" rel="noreferrer">Mở chứng từ kho<ExternalLink className="ml-1.5 h-4 w-4" /></a>
                </Button>
            }
        >
            {(data) => (
                <div className="max-w-5xl mx-auto print:m-0 print:max-w-none">
                    <div
                        className="bg-white rounded-md shadow-sm border border-gray-200 p-5"
                    >
                        <ExportInfo data={data} />
                        <ExportItems data={data} items={data.items ?? []} />
                    </div>
                </div>
            )}
        </PageSection>
    )
}
