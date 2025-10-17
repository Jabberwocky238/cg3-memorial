// 后端 API 基础配置
const API_BASE_URL = '/api';
// 通用请求函数
async function apiRequest(
    headers: Record<string, string>,
    formData: FormData,
): Promise<Response> {
    try {
        const response = await fetch(`${API_BASE_URL}/rpc`, {
            method: 'POST',
            headers: {
                ...headers,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '请求失败' }));
            throw new Error(`HTTP ${response.status} ${errorData.error}`);
        }

        // 处理 204 No Content 响应
        if (response.status === 204) {
            return response;
        }
        return response
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Request failed');
    }
}

export interface ArTxRecordDAO {
    id: number;
    tx_id: string;
    uid: string;
    created_at: Date;
    content_type: string;
    headers: string;
    content: File;
    msg_type: string;
}

export interface ArticleDAO {
    aid: string;
    uid: string;
    title: string;
    poster: string;
    content: string;
    created_at: string;
    updated_at: string;
    chain: string;
    tags: string;
}

export const RPC_CALLS = [
    'REPORT_UPCHAIN_TX',
    'GET_UPCHAIN_TX',
    'GET_UPCHAIN_TXS',

    'UPDATE_ARTICLE',
    'GET_ARTICLE',
    'LIST_ARTICLES',

    'UPDATE_ARTICLE_TOPICS',
    'SEARCH_TOPICS',
    'RANK_TOPICS_TOPK',
] as const;

export async function RPC_call(rpcType: (typeof RPC_CALLS)[number], params: Record<string, string | Blob>): Promise<Response> {
    const formData = new FormData();
    formData.append('rpc_type', rpcType);
    for (const [key, value] of Object.entries(params)) {
        formData.append(key, value as any as string | Blob);
    }
    return await apiRequest({}, formData);
}