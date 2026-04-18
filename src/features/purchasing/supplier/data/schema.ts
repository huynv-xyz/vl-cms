import type { Nation } from "@/features/purchasing/nation/data/schema"

export type Supplier = {
    id: number
    code: string
    name: string
    nation_id?: number
    nation?: Nation
    created_at?: string
    updated_at?: string
}