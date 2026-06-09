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

    const response = await fetch(url.toString(), {
        ...options,
        headers,
        body: options.body,
        signal: options.signal ?? AbortSignal.timeout(120_000),
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const body = await response.json()

    if (body.code !== 0) {
        throw new Error(body.msg ?? "API error")
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
