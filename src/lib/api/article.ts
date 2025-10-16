import type { ApiResponse } from "./base";
import { apiRequest } from "./base";

// 类型定义
export interface Article {
    aid: string;
    uid: string;
    title: string;
    content: string;
    tags: string;
    created_at: string;
    updated_at: string;
}


// 文章相关 API
async function listArticles(): Promise<ApiResponse<Article[]>> {
    return apiRequest<Article[]>('/articles');
}

async function getArticle(aid: string): Promise<ApiResponse<Article>> {
    return apiRequest<Article>(`/articles/${encodeURIComponent(aid)}`);
}

async function createArticle(
    uid: string,
    title: string,
    content: string,
    tags: string,
): Promise<ApiResponse<Article>> {
    return apiRequest<Article>('/articles', {
        method: 'POST',
        body: JSON.stringify({ uid, title, content, tags }),
    });
}

async function updateArticle(
    aid: string,
    title?: string,
    content?: string,
    tags?: string
): Promise<ApiResponse<Article>> {
    return apiRequest<Article>(`/articles/${encodeURIComponent(aid)}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content, tags }),
    });
}

async function deleteArticle(aid: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/articles/${encodeURIComponent(aid)}`, {
        method: 'DELETE',
    });
}

const articleApi = {
    list: listArticles,
    get: getArticle,
    create: createArticle,
    update: updateArticle,
    delete: deleteArticle,
}

export default articleApi;