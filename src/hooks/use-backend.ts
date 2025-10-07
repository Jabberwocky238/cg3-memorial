
// 类型定义
export interface Article {
  aid: string;
  uid: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  uid: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 后端 API 基础配置
const API_BASE_URL = '/api';

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
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
  content: string
): Promise<ApiResponse<Article>> {
  return apiRequest<Article>('/articles', {
    method: 'POST',
    body: JSON.stringify({ uid, title, content }),
  });
}

async function updateArticle(
  aid: string,
  title?: string,
  content?: string
): Promise<ApiResponse<Article>> {
  return apiRequest<Article>(`/articles/${encodeURIComponent(aid)}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content }),
  });
}

async function deleteArticle(aid: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/articles/${encodeURIComponent(aid)}`, {
    method: 'DELETE',
  });
}

// 用户相关 API
async function createUser(uid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ uid }),
  });
}

async function getUser(uid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/users/${encodeURIComponent(uid)}`);
}

async function updateUser(uid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/users/${encodeURIComponent(uid)}`, {
    method: 'PUT',
  });
}

export function useApi() {
  return {
    listArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,

    createUser,
    getUser,
    updateUser,

    loadThisUserAccount,
  };
}

/// ##################### Wallet

// const CASHIER_URL = "http://localhost:8787" 
const CASHIER_URL = "https://cashier.permane.world"

async function loadThisUserAccount(jwt: string) {
  const result = await fetch(CASHIER_URL + "/my_account", {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    }
  })
  if (!result.ok) {
    throw new Error("Failed to load this user account")
  }
  const data = await result.json() as {
    uid_firebase: string;
    balance_usd: number;
    misc: string;
    created_at: string;
    updated_at: string;
  }
  return data
}