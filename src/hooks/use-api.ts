import { createContext, useCallback, useContext, useMemo } from 'react'

// 基础类型
export type Id = string

export type Article = {
	id: Id
	title: string
	body: string
	authorId: Id
	status: 'draft' | 'published'
	tags?: string[]
	createdAt: string
	updatedAt: string
}

export type Comment = {
	id: Id
	articleId: Id
	authorId: Id
	body: string
	createdAt: string
}

// 统一错误码
export enum ApiErrorCode {
	Unauthorized = 'UNAUTHORIZED', // 401
	Forbidden = 'FORBIDDEN', // 403
	NotFound = 'NOT_FOUND', // 404
	Validation = 'VALIDATION_ERROR', // 422
	RateLimit = 'RATE_LIMITED', // 429
	Server = 'SERVER_ERROR', // 500-599
	Network = 'NETWORK_ERROR',
	Timeout = 'TIMEOUT',
	Parse = 'PARSE_ERROR',
	Unknown = 'UNKNOWN_ERROR',
}

export class ApiError extends Error {
	readonly code: ApiErrorCode
	readonly status?: number
	readonly details?: unknown

	constructor(code: ApiErrorCode, message: string, status?: number, details?: unknown) {
		super(message)
		this.code = code
		this.status = status
		this.details = details
	}
}

type FetchLike = typeof fetch

export type ApiClientOptions = {
	baseUrl?: string
	/** 获取认证 token（如 Firebase ID token），返回字符串或空 */
	getAuthToken?: () => Promise<string | undefined> | string | undefined
	/** 请求超时毫秒数 */
	timeoutMs?: number
	/** 全局错误处理（统一兜底） */
	onError?: (error: ApiError) => void
	/** 自定义 fetch（便于测试） */
	fetchImpl?: FetchLike
}

export class ApiClient {
	private readonly baseUrl: string
	private readonly getAuthToken?: ApiClientOptions['getAuthToken']
	private readonly timeoutMs: number
	private readonly onError?: ApiClientOptions['onError']
	private readonly fetchImpl: FetchLike

	constructor(opts: ApiClientOptions = {}) {
		this.baseUrl = (opts.baseUrl ?? '/api').replace(/\/$/, '')
		this.getAuthToken = opts.getAuthToken
		this.timeoutMs = opts.timeoutMs ?? 15000
		this.onError = opts.onError
		this.fetchImpl = opts.fetchImpl ?? fetch
	}

	private async request<T>(path: string, init?: RequestInit & { retry?: number }): Promise<T> {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
		try {
			const headers = new Headers(init?.headers)
			headers.set('Accept', 'application/json')
			if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
			const token = await Promise.resolve(this.getAuthToken?.())
			if (token) headers.set('Authorization', `Bearer ${token}`)

			const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
				...init,
				signal: controller.signal,
				headers,
			})

			const text = await res.text()
			const isJson = (res.headers.get('content-type') || '').includes('application/json')
			const data = text ? (isJson ? JSON.parse(text) : (text as unknown)) : undefined

			if (!res.ok) {
				throw this.normalizeError(res.status, data)
			}

			return data as T
		} catch (err) {
			const apiErr = this.coerceError(err)
			this.onError?.(apiErr)
			throw apiErr
		} finally {
			clearTimeout(timeout)
		}
	}

	private normalizeError(status: number, payload: any): ApiError {
		const message: string = payload?.message || payload?.error || `Request failed with status ${status}`
		let code: ApiErrorCode = ApiErrorCode.Unknown
		if (status === 401) code = ApiErrorCode.Unauthorized
		else if (status === 403) code = ApiErrorCode.Forbidden
		else if (status === 404) code = ApiErrorCode.NotFound
		else if (status === 422) code = ApiErrorCode.Validation
		else if (status === 429) code = ApiErrorCode.RateLimit
		else if (status >= 500) code = ApiErrorCode.Server
		return new ApiError(code, message, status, payload)
	}

	private coerceError(err: unknown): ApiError {
		if (err instanceof ApiError) return err
		// Abort/超时
		if (err instanceof DOMException && err.name === 'AbortError') {
			return new ApiError(ApiErrorCode.Timeout, '请求超时')
		}
		// 网络错误
		return new ApiError(ApiErrorCode.Network, err instanceof Error ? err.message : '网络异常')
	}

	// 文章 APIs
	listArticles = (params?: { page?: number; pageSize?: number; tag?: string; authorId?: Id; q?: string; sort?: 'latest' | 'hot' }) => {
		const qs = new URLSearchParams()
		if (params?.page) qs.set('page', String(params.page))
		if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
		if (params?.tag) qs.set('tag', params.tag)
		if (params?.authorId) qs.set('authorId', params.authorId)
		if (params?.q) qs.set('q', params.q)
		if (params?.sort) qs.set('sort', params.sort)
		return this.request<{ items: Article[]; total: number }>(`/articles?${qs.toString()}`)
	}

	getArticle = (id: Id) => this.request<Article>(`/articles/${id}`)

	createArticle = (payload: { title: string; body: string; tags?: string[]; status?: 'draft' | 'published' }) =>
		this.request<Article>(`/articles`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})

	updateArticle = (id: Id, payload: Partial<Pick<Article, 'title' | 'body' | 'tags' | 'status'>>) =>
		this.request<Article>(`/articles/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		})

	deleteArticle = (id: Id) =>
		this.request<{ success: true }>(`/articles/${id}`, {
			method: 'DELETE',
		})

	publishArticle = (id: Id) =>
		this.request<Article>(`/articles/${id}/publish`, { method: 'POST' })

	unpublishArticle = (id: Id) =>
		this.request<Article>(`/articles/${id}/unpublish`, { method: 'POST' })

	likeArticle = (id: Id) => this.request<{ likes: number }>(`/articles/${id}/like`, { method: 'POST' })
	unlikeArticle = (id: Id) => this.request<{ likes: number }>(`/articles/${id}/unlike`, { method: 'POST' })

	bookmarkArticle = (id: Id) => this.request<{ bookmarked: boolean }>(`/articles/${id}/bookmark`, { method: 'POST' })
	unbookmarkArticle = (id: Id) => this.request<{ bookmarked: boolean }>(`/articles/${id}/unbookmark`, { method: 'POST' })

	addComment = (articleId: Id, payload: { body: string }) =>
		this.request<Comment>(`/articles/${articleId}/comments`, {
			method: 'POST',
			body: JSON.stringify(payload),
		})

	deleteComment = (articleId: Id, commentId: Id) =>
		this.request<{ success: true }>(`/articles/${articleId}/comments/${commentId}`, { method: 'DELETE' })

	listComments = (articleId: Id, params?: { page?: number; pageSize?: number }) => {
		const qs = new URLSearchParams()
		if (params?.page) qs.set('page', String(params.page))
		if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
		return this.request<{ items: Comment[]; total: number }>(`/articles/${articleId}/comments?${qs.toString()}`)
	}

	searchArticles = (q: string, params?: { page?: number; pageSize?: number }) => {
		const qs = new URLSearchParams({ q })
		if (params?.page) qs.set('page', String(params.page))
		if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
		return this.request<{ items: Article[]; total: number }>(`/search/articles?${qs.toString()}`)
	}

	uploadImage = (file: File) => {
		const form = new FormData()
		form.append('file', file)
		return this.request<{ url: string }>(`/uploads/images`, { method: 'POST', body: form })
	}

	// 草稿 APIs
	listDrafts = (params?: { page?: number; pageSize?: number }) => {
		const qs = new URLSearchParams()
		if (params?.page) qs.set('page', String(params.page))
		if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
		return this.request<{ items: Article[]; total: number }>(`/drafts?${qs.toString()}`)
	}

	createDraft = (payload: { title: string; body: string; tags?: string[] }) =>
		this.request<Article>(`/drafts`, { method: 'POST', body: JSON.stringify(payload) })

	updateDraft = (id: Id, payload: Partial<Pick<Article, 'title' | 'body' | 'tags'>>) =>
		this.request<Article>(`/drafts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

	deleteDraft = (id: Id) => this.request<{ success: true }>(`/drafts/${id}`, { method: 'DELETE' })
}

// 统一错误分派（页面可按需订阅）
export type ErrorDispatcher = (error: ApiError) => void

function defaultErrorDispatcher(error: ApiError) {
	switch (error.code) {
		case ApiErrorCode.Unauthorized:
			console.warn('未登录或登录已过期')
			break
		case ApiErrorCode.Forbidden:
			console.warn('没有权限执行该操作')
			break
		case ApiErrorCode.NotFound:
			console.warn('资源不存在')
			break
		case ApiErrorCode.Validation:
			console.warn('参数校验失败', error.details)
			break
		case ApiErrorCode.RateLimit:
			console.warn('请求过于频繁，请稍后重试')
			break
		case ApiErrorCode.Server:
			console.error('服务端异常，请稍后再试')
			break
		case ApiErrorCode.Timeout:
			console.warn('请求超时')
			break
		case ApiErrorCode.Network:
			console.warn('网络异常，请检查网络连接')
			break
		default:
			console.warn('发生未知错误', error)
	}
}

const ApiContext = createContext<ApiClient | null>(null)

export function ApiProvider({ children, value }: { children: React.ReactNode; value?: ApiClientOptions }) {
	const client = useMemo(() => new ApiClient({ ...value, onError: value?.onError ?? defaultErrorDispatcher }), [value])
	return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
}

export function useApi() {
	const client = useContext(ApiContext)
	if (!client) throw new Error('useApi must be used within <ApiProvider>')
	return client
}

// 便捷 hooks：常用操作再包一层，便于在页面中直接调用
export function useArticleApi() {
	const api = useApi()

	return useMemo(
		() => ({
			list: api.listArticles,
			get: api.getArticle,
			create: api.createArticle,
			update: api.updateArticle,
			remove: api.deleteArticle,
			publish: api.publishArticle,
			unpublish: api.unpublishArticle,
			like: api.likeArticle,
			unlike: api.unlikeArticle,
			bookmark: api.bookmarkArticle,
			unbookmark: api.unbookmarkArticle,
			addComment: api.addComment,
			deleteComment: api.deleteComment,
			listComments: api.listComments,
			search: api.searchArticles,
			uploadImage: api.uploadImage,
			drafts: {
				list: api.listDrafts,
				create: api.createDraft,
				update: api.updateDraft,
				remove: api.deleteDraft,
			},
		}),
		[api],
	)
}


