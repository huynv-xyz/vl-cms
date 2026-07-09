import { useAuthStore } from "@/stores/auth-store"
import { API_BASE } from "@/config"

export type PagedResult<T> = {
    items: T[]
    total: number
    current_page: number
    total_page: number
    size: number
}

function getAccessToken(): string {
    if (typeof window === "undefined") return ""

    const storeToken = useAuthStore.getState().state.accessToken
    if (storeToken) return storeToken

    try {
        return localStorage.getItem("access_token") ?? ""
    } catch {
        return ""
    }
}

function buildUrl(path: string, query?: Record<string, any>): URL {
    const base = API_BASE.replace(/\/$/, "")
    const cleanPath = path.startsWith("/") ? path : `/${path}`

    const url = new URL(`${base}${cleanPath}`)

    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.set(key, String(value))
            }
        }
    }

    return url
}

type RequestBody = BodyInit | undefined

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: RequestBody
    contentType?: string
}

export async function request<T>(
    path: string,
    options: RequestOptions = {},
    query?: Record<string, any>
): Promise<T> {
    const url = buildUrl(path, query)
    const token = getAccessToken()

    const headers = new Headers(options.headers ?? {})

    if (options.contentType && !headers.has("Content-Type")) {
        headers.set("Content-Type", options.contentType)
    }

    // nếu cần auth thì mở lại
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`)
    }

    let response: Response
    try {
        response = await fetch(url.toString(), {
            ...options,
            headers,
            body: options.body,
            signal: options.signal ?? AbortSignal.timeout(120_000),
        })
    } catch {
        throw new Error("Failed to fetch")
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        let errorMessage = errorText
        let errorData: any = null
        let errorCode: any = undefined
        try {
            const errorBody = JSON.parse(errorText)
            errorMessage = errorBody?.msg || errorText
            errorData = errorBody?.data ?? errorBody?.meta ?? null
            errorCode = errorBody?.code
        } catch {
            // keep raw response text when the server does not return ApiResponse JSON
        }
        const error = new Error(errorMessage || `HTTP ${response.status}`)
        ;(error as any).data = errorData
        ;(error as any).code = errorCode
        throw error
    }

    const body = await response.json()

    if (body.code !== 0) {
        const error = new Error(body.msg ?? "API error")
        ;(error as any).data = body.data ?? body.meta ?? null
        ;(error as any).code = body.code
        throw error
    }

    return body.data as T
}

export function apiGet<T>(path: string, query?: Record<string, any>) {
    return request<T>(path, { method: "GET" }, query)
}

export function apiPost<T>(path: string, body?: any) {
    return request<T>(path, {
        method: "POST",
        contentType: "application/json",
        body: body ? JSON.stringify(body) : undefined,
    })
}

export function apiPostForm<T>(path: string, body?: Record<string, any>) {
    const params = new URLSearchParams()

    if (body) {
        Object.entries(body).forEach(([key, value]) => {
            if (value === undefined || value === null) return
            params.append(key, String(value))
        })
    }

    return request<T>(path, {
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        body: params,
    })
}

export function apiPostMultipart<T>(
    path: string,
    formData: FormData,
    options: Omit<RequestOptions, "method" | "body" | "contentType"> = {}
) {
    return request<T>(path, {
        ...options,
        method: "POST",
        body: formData,
    })
}

export function apiPut<T>(path: string, body?: any) {
    return request<T>(path, {
        method: "PUT",
        contentType: "application/json",
        body: body ? JSON.stringify(body) : undefined,
    })
}

export function apiDelete<T>(path: string, body?: any) {
    return request<T>(path, {
        method: "DELETE",
        contentType: "application/json",
        body: body ? JSON.stringify(body) : undefined,
    })
}
