import { createFileRoute } from "@tanstack/react-router"
import RegionPoolPage from "@/features/region-pool"

export const Route = createFileRoute("/_authenticated/salary/region-pool/")({
  component: RegionPoolPage,
})
