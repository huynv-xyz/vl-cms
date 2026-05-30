import { useQuery } from "@tanstack/react-query"
import { getExport } from "@/api/sale/export"
import { ExportInfo } from "./components/export-info"
import { ExportItems } from "./components/export-items"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

const EXPORT_PRINT_CSS = `
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }
  body * { visibility: hidden !important; }
  #export-print-area, #export-print-area * { visibility: visible !important; }
  #export-print-area {
    position: absolute !important;
    left: 50% !important;
    top: 0 !important;
    width: 200mm !important;
    max-width: 200mm !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    transform: translateX(-50%) !important;
    overflow: visible !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  #export-print-area table { page-break-inside: auto; }
  #export-print-area tr { page-break-inside: avoid; page-break-after: auto; }
  @page { size: 210mm 148mm; margin: 5mm; }
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
                <div className="max-w-5xl mx-auto print:m-0 print:max-w-none">
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
