import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

export function CurrencyWidget({
    value,
    onChange,
    disabled,
}: any) {
    const [display, setDisplay] = useState("")

    useEffect(() => {
        if (value == null) {
            setDisplay("")
            return
        }

        const formatted = Number(value).toLocaleString("vi-VN")
        setDisplay(formatted)
    }, [value])

    const handleChange = (e: any) => {
        const raw = e.target.value.replace(/\D/g, "") // bỏ dấu

        const numberValue = raw ? Number(raw) : 0

        setDisplay(
            numberValue.toLocaleString("vi-VN")
        )

        onChange(numberValue)
    }

    return (
        <Input
            value={display}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Nhập số tiền"
        />
    )
}