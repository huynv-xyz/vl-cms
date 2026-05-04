export type Option<T = any> = {
    value: string | number
    label: string
    raw: T
}

type CreateMapperConfig<T> = {
    getValue?: (x: T) => string | number
    getLabel: (x: T) => string
}

export function createOptionMapper<T = any>({
    getValue = (x: any) => x.id,
    getLabel,
}: CreateMapperConfig<T>) {
    return (x?: T | null): Option<T> | null => {
        if (!x) return null

        return {
            value: getValue(x),
            label: getLabel(x),
            raw: x,
        }
    }
}

export const nationOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.name}${x.code ? ` (${x.code})` : ""}`,
})

export const supplierOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.name}${x.code ? ` (${x.code})` : ""}`,
})

export const currencyOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.code}${x.name ? ` - ${x.name}` : ""}`,
})

export const productOption = (x: any) => ({
    value: x.id,
    label: `${x.code} - ${x.name}`,
    raw: x,
})

export const shipmentOption = (item: any) => ({
    value: item.id,
    label: `${item.code ?? "Lô"}${item.etd ? ` - ${item.etd}` : ""}`,
})

export const orderOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.order_no}${x.customer?.name ? ` - ${x.customer.name}` : ""}`,
})

export const exportOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.export_no}`,
})


export const warehouseOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.name}${x.code ? ` (${x.code})` : ""}`,
})

export const companyOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.name}${x.code ? ` (${x.code})` : ""}`,
})

export const deliveryOption = createOptionMapper({
    getLabel: (x: any) =>
        `${x.delivery_no}${x.order?.order_no ? ` - ${x.order.order_no}` : ""}`,
})

