import { apiGet, apiGetBlob, apiPost, apiPostMultipart, apiPut, type PagedResult } from "@/api/client"
import { createCrudApi } from "@/api/crud"

export type BusinessArea = {
    id: number
    parent_id?: number | null
    parent?: BusinessArea
    area_type: "REGION" | "AREA"
    code: string
    name: string
    status: number
}

export type AdministrativeUnit = {
    id: number
    version: "OLD" | "CURRENT"
    parent_id?: number | null
    parent?: AdministrativeUnit
    province?: AdministrativeUnit
    district?: AdministrativeUnit
    level: "PROVINCE" | "DISTRICT" | "WARD"
    unit_type: string
    name: string
    status: number
}

export type AdministrativeUnitInput = {
    id?: number
    unit_type: string
    name: string
}

export type AdministrativeUnitPath = {
    province: AdministrativeUnitInput
    district?: AdministrativeUnitInput
    ward?: AdministrativeUnitInput
}

export type AdministrativeUnitMapping = {
    id: number
    old_unit_id: number
    current_unit_id: number
    mapping_type: "FULL" | "PARTIAL"
    old_path: AdministrativeUnitPath
    current_path: AdministrativeUnitPath
    business_area_id?: number | null
    business_area?: BusinessArea
    business_area_source?: "DIRECT" | "INHERITED"
    business_area_inherited_from?: string
    status: number
}
export type AdministrativeUnitCounterparts = {
    items: AdministrativeUnit[]
    suggested_ids: number[]
}

export type AdministrativeUnitDirectoryRow = {
    id: number
    source_path: AdministrativeUnitPath
    counterparts: AdministrativeUnitMapping[]
    business_area_id?: number | null
    business_area?: BusinessArea
    business_area_source?: "DIRECT" | "INHERITED"
    business_area_inherited_from?: string
    status: number
}

export type TerritoryUnit = {
    id: number
    name: string
    unit_type: string
    level: "PROVINCE" | "WARD"
    status: number
    province_name?: string
    inherited_wards?: number
    preserved_overrides?: number
}

export type BusinessTerritory = {
    provinces: TerritoryUnit[]
    wards: TerritoryUnit[]
    inherited_wards: number
    effective_wards: number
}

export type TerritoryPreview = {
    unit_id: number
    unit_name: string
    level: "PROVINCE" | "WARD"
    direct_area_id: number | null
    effective_area_id: number | null
    target_area_id: number | null
    affected_wards: number
    preserved_overrides: number
}
export type TerritoryBatchPreview = {
    selected_count: number
    target_count: number
    updated_units: number
    affected_wards: number
    preserved_overrides: number
    partial_mappings?: number
    targets_preview?: Array<{ id: number; name: string; level: "PROVINCE" | "WARD" }>
    auto_count?: number
    already_count?: number
    cross_count?: number
    other_area_count?: number
    mapping_issue_count?: number
    missing_count?: number
    auto_unit_ids?: number[]
    missing_old_units?: Array<{ id: number; name: string; parent_name?: string; province_name?: string }>
    targets?: TerritoryOldTarget[]
}
export type TerritoryOldTarget = {
    id: number
    name: string
    province_name?: string
    decision: "READY" | "ALREADY" | "CROSS_BOUNDARY" | "OTHER_AREA" | "MAPPING_ISSUE"
    current_area_id?: number
    current_area_name?: string
    old_constituents: Array<{ id: number; path: string; within_selection: boolean; active: boolean }>
}

export type BusinessAreaParams = {
    page: number
    size: number
    keyword?: string
    area_type?: string
    parent_id?: number
    status?: number
}

export type AdministrativeUnitParams = {
    page: number
    size: number
    keyword?: string
    version?: string
    level?: string
    parent_id?: number
    ancestor_id?: number
    status?: number
}

export type AdministrativeUnitMappingParams = {
    page: number
    size: number
    keyword?: string
    view?: "OLD" | "CURRENT"
    administrative_unit_id?: number
    counterpart_administrative_unit_id?: number
    mapping_type?: "FULL" | "PARTIAL"
    region_id?: number
    business_area_id?: number
    status?: number
}

export type AdministrativeUnitImportResult = {
    rows: number
    created_units: number
    created_mappings: number
    updated_mappings: number
    unchanged_mappings: number
}
export type AdministrativeUnitSummary = {
    PROVINCE: number
    DISTRICT: number
    WARD: number
}
export type AdministrativeBoundaryFile = {
    file_name: string
    bytes: number
    updated_at: string
    feature_count?: number
    sample_names?: string[]
    province_name?: string
    url: string
}
export type AdministrativeMapTerritory = {
    areas: Array<{ id: number; parent_id: number | null; area_type: "REGION" | "AREA"; name: string }>
    codes: string[]
}
export type BusinessAreaRequest = Omit<BusinessArea, "id" | "parent"> & { id?: number }
export type AdministrativeUnitRequest = Omit<AdministrativeUnit, "id" | "parent" | "province" | "district"> & { id?: number }
export type AdministrativeUnitMappingRequest = {
    old_path: AdministrativeUnitPath
    current_path: AdministrativeUnitPath
    mapping_type?: "FULL" | "PARTIAL"
    status: number
}

const businessAreaApi = createCrudApi<BusinessArea, BusinessAreaRequest, BusinessAreaRequest & { id: number }, BusinessAreaParams>("/business-areas")
const administrativeUnitApi = createCrudApi<AdministrativeUnit, AdministrativeUnitRequest, AdministrativeUnitRequest & { id: number }, AdministrativeUnitParams>("/administrative-units")
const administrativeUnitMappingApi = createCrudApi<AdministrativeUnitMapping, AdministrativeUnitMappingRequest, AdministrativeUnitMappingRequest & { id: number }, AdministrativeUnitMappingParams>("/administrative-unit-mappings")

export const listBusinessAreas = businessAreaApi.list
export const getBusinessArea = businessAreaApi.detail
export const createBusinessArea = businessAreaApi.create
export const updateBusinessArea = businessAreaApi.update
export const deleteBusinessArea = businessAreaApi.delete
export const getBusinessTerritory = (areaId: number) =>
    apiGet<BusinessTerritory>(`/business-areas/${areaId}/territory`)
export const previewBusinessTerritory = (unitId: number, areaId?: number) =>
    apiGet<TerritoryPreview>("/business-areas/territory/preview", { unit_id: unitId, area_id: areaId })
export const assignBusinessTerritory = (unitId: number, areaId?: number) =>
    apiPut<TerritoryPreview>(`/business-areas/territory/${unitId}`, { business_area_id: areaId ?? null })
export const previewBusinessTerritoryBatch = (version: "OLD" | "CURRENT", unitIds: number[], areaId: number) =>
    apiPost<TerritoryBatchPreview>("/business-areas/territory/batch/preview", { version, unit_ids: unitIds, business_area_id: areaId })
export const assignBusinessTerritoryBatch = (version: "OLD" | "CURRENT", unitIds: number[], areaId: number, confirmedUnitIds?: number[]) =>
    apiPut<TerritoryBatchPreview>("/business-areas/territory/batch", { version, unit_ids: unitIds, business_area_id: areaId, confirmed_unit_ids: confirmedUnitIds })

export const listAdministrativeUnits = administrativeUnitApi.list
export const getAdministrativeUnit = administrativeUnitApi.detail
export const getAdministrativeUnitCounterparts = (unitId: number) =>
    apiGet<AdministrativeUnitCounterparts>(`/administrative-unit-mappings/counterparts/${unitId}`)
export const createAdministrativeUnit = administrativeUnitApi.create
export const updateAdministrativeUnit = administrativeUnitApi.update
export const deleteAdministrativeUnit = administrativeUnitApi.delete
export const getAdministrativeUnitSummary = (version: "OLD" | "CURRENT") =>
    apiGet<AdministrativeUnitSummary>("/administrative-units/summary", { version })
export const getAdministrativeMapTerritory = (view: "OLD" | "CURRENT", level: "PROVINCE" | "DISTRICT" | "WARD", regionId?: number, areaId?: number) =>
    apiGet<AdministrativeMapTerritory>("/administrative-units/map-territory", {
        view, level, region_id: regionId, business_area_id: areaId,
    })
export const listAdministrativeBoundaryFiles = async (): Promise<AdministrativeBoundaryFile[]> => {
    const files = await apiGet<AdministrativeBoundaryFile[] | null>("/administrative-units/boundary-files")
    if (files == null) return []
    if (!Array.isArray(files)) throw new Error("Danh sách file ranh giới trả về không hợp lệ")
    return files
}
export const uploadAdministrativeBoundaryFile = (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiPostMultipart<AdministrativeBoundaryFile>("/administrative-units/boundary-files/upload", form)
}
export const downloadAdministrativeBoundaryFile = (filename: string) =>
    apiGetBlob(`/administrative-units/boundary-files/${encodeURIComponent(filename)}`)

export const listAdministrativeUnitMappings = administrativeUnitMappingApi.list
export const listAdministrativeUnitDirectory = (params: AdministrativeUnitMappingParams) =>
    apiGet<PagedResult<AdministrativeUnitDirectoryRow>>("/administrative-unit-mappings/directory", {
        ...params,
        limit: params.size,
    })
export const getAdministrativeUnitMapping = administrativeUnitMappingApi.detail
export const createAdministrativeUnitMapping = administrativeUnitMappingApi.create
export const updateAdministrativeUnitMapping = administrativeUnitMappingApi.update
export const deleteAdministrativeUnitMapping = administrativeUnitMappingApi.delete
export function importAdministrativeUnitsExcel(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return apiPostMultipart<AdministrativeUnitImportResult>("/administrative-unit-mappings/import-excel", formData)
}
