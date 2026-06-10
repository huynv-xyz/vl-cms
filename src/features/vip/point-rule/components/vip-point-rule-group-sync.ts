import type { VipPointGroup } from "../data/schema"
import type { VipPointRuleFormValues } from "./types"

export function applySelectedPointGroup(
    values: VipPointRuleFormValues,
    groups: VipPointGroup[],
): VipPointRuleFormValues {
    const group = groups.find((item) => item.group_code === values.group_code)

    if (!group) {
        return {
            ...values,
            unit: "",
            he_so_mb: 0,
            he_so_mn: 0,
        }
    }

    return {
        ...values,
        unit: group.unit ?? "",
        he_so_mb: group.he_so_mb ?? 0,
        he_so_mn: group.he_so_mn ?? 0,
    }
}
