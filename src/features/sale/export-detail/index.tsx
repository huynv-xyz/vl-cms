import { useQuery } from "@tanstack/react-query"
import { getExport } from "@/api/sale/export"
import { ExportInfo } from "./components/export-info"
import { ExportItems } from "./components/export-items"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

const EXPORT_PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #export-print-area, #export-print-area * { visibility: visible !important; }
  #export-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }
  #export-print-area table { page-break-inside: auto; }
  #export-print-area tr { page-break-inside: avoid; page-break-after: auto; }
  @page { size: A4 portrait; margin: 8mm; }
}
`

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
            title="Phiếu xuất kho"
            showBack
            actions={
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                >
                    <Printer className="h-4 w-4 mr-1.5" />
                    In phiếu
                </Button>
            }
        >
            {(data) => (
                <div className="max-w-5xl mx-auto">
                    <style>{EXPORT_PRINT_CSS}</style>
                    <div
                        id="export-print-area"
                        className="bg-white rounded-md shadow-sm border border-gray-200 p-5 print:shadow-none print:border-none print:p-0"
                    >
                        <ExportInfo data={data} />
                        <ExportItems data={data} items={data.items ?? []} />
                    </div>
                </div>
            )}
        </PageSection>
    )
}
