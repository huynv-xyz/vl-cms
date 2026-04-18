import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"
import { getShipment } from "@/api/purchasing/shipment"
import { Shipment } from "../data/schema"

const ctx = createCrudDialogContext<Shipment>("shipment", {
    fetchById: async (id) => {
        const res: any = await getShipment(id)
        return res?.data ?? res
    },
})

export const ShipmentsProvider = ctx.Provider
export const useShipments = ctx.useCrudDialog