import { createFileRoute } from "@tanstack/react-router"
import AdministrativeUnitPage from "@/features/administrative-unit"

export const Route = createFileRoute("/_authenticated/administrative-units/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        status: typeof search.status === "string" ? search.status : undefined,
        mapping_type: typeof search.mapping_type === "string" ? search.mapping_type : undefined,
        region_id: typeof search.region_id === "string" ? search.region_id : undefined,
        business_area_id: typeof search.business_area_id === "string" ? search.business_area_id : undefined,
        province_id: typeof search.province_id === "string" ? search.province_id : undefined,
        district_id: typeof search.district_id === "string" ? search.district_id : undefined,
        ward_id: typeof search.ward_id === "string" ? search.ward_id : undefined,
        counterpart_province_id: typeof search.counterpart_province_id === "string" ? search.counterpart_province_id : undefined,
        counterpart_district_id: typeof search.counterpart_district_id === "string" ? search.counterpart_district_id : undefined,
        counterpart_ward_id: typeof search.counterpart_ward_id === "string" ? search.counterpart_ward_id : undefined,
        view: search.view === "OLD" || search.view === "CURRENT" ? search.view : "OLD",
    }),
    component: AdministrativeUnitPage,
})
