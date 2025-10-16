// 后端 API 基础配置
const API_BASE_URL = '/api';

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// 通用请求函数
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '请求失败' }));
            return { error: errorData.error || `HTTP ${response.status}` };
        }

        // 处理 204 No Content 响应
        if (response.status === 204) {
            return {};
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return { error: error instanceof Error ? error.message : '网络请求失败' };
    }
}
