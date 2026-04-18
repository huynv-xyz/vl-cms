import { customizeValidator } from "@rjsf/validator-ajv8"
import ajvErrors from "ajv-errors"

export const rjsfValidator = (() => {
    const v = customizeValidator({
        ajvOptionsOverrides: {
            allErrors: true,
        },
    })
    ajvErrors(v.ajv) // patch Ajv để hiểu keyword "errorMessage"
    return v
})()
