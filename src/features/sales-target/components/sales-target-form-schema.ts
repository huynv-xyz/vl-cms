import type { RJSFSchema, UiSchema } from "@rjsf/utils"

export const salesTargetSchema: RJSFSchema = {
    type: "object",
    required: ["employeeId", "period"],
    properties: {
        employeeId: {
            type: "integer",
            title: "Nhân viên",
        },

        period: {
            type: "number",
            title: "Kỳ",
            minimum: 202601,
        },

        bonGoc: {
            type: "number",
            title: "Bón góc",
            default: 0,
        },

        bonLaBot: {
            type: "number",
            title: "Bón là bột",
            default: 0,
        },

        clcn: {
            type: "number",
            title: "CLCN",
            default: 0,
        },

        bonLaLong: {
            type: "number",
            title: "Bổn lá lỏng",
            default: 0,
        },
    },

    errorMessage: {
        required: {
            employeeId: "Nhân viên không được để trống",
            period: "Kỳ không được để trống",
        },
    },
}

export const salesTargetUiSchema: UiSchema = {
    employeeId: {
        "ui:widget": "select",
    },

    period: {
        "ui:placeholder": "VD: 202401",
    },

    bonGoc: {
        "ui:widget": "updown",
    },

    bonLaBot: {
        "ui:widget": "updown",
    },

    clcn: {
        "ui:widget": "updown",
    },

    bonLaLong: {
        "ui:widget": "updown",
    },
}