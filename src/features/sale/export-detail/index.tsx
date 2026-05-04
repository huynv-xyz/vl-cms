import { useQuery } from "@tanstack/react-query"
import { getExport } from "@/api/sale/export"
import { ExportInfo } from "./components/export-info"
import { ExportItems } from "./components/export-items"
import { PageSection } from "@/components/page-section"

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
            title="Chi tiết phiếu xuất"
            showBack
        >

            {(data) => (

                <div className="space-y-4">
                    <ExportInfo data={data} />
                    <ExportItems items={data.items ?? []} />
                </div>

            )}

        </PageSection>

    )
}