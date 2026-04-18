import { useEffect, useRef, useState } from "react"

export function useAsyncSelect({
    value,
    loadOptions,
    loadByValue,
    initialOption,
    keyword,
}: any) {
    const [options, setOptions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<any | null>(null)

    const cacheRef = useRef<Map<any, any>>(new Map())

    // 🔥 debounce keyword
    useEffect(() => {
        if (!loadOptions) return

        const t = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await loadOptions(keyword)
                setOptions(res || [])
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(t)
    }, [keyword, loadOptions])

    // 🔥 sync value
    useEffect(() => {
        let active = true

        const run = async () => {
            if (value == null) {
                setSelected(null)
                return
            }

            // cache
            if (cacheRef.current.has(value)) {
                setSelected(cacheRef.current.get(value))
                return
            }

            // initial
            if (initialOption && String(initialOption.value) === String(value)) {
                cacheRef.current.set(value, initialOption)
                setSelected(initialOption)
                return
            }

            // options
            const found = options.find((x) => String(x.value) === String(value))
            if (found) {
                cacheRef.current.set(value, found)
                setSelected(found)
                return
            }

            // API
            if (loadByValue) {
                const item = await loadByValue(value)
                if (item && active) {
                    cacheRef.current.set(value, item)
                    setSelected(item)
                }
            }
        }

        run()
        return () => {
            active = false
        }
    }, [value, options, loadByValue, initialOption])

    return {
        options,
        loading,
        selected,
        setSelected,
    }
}