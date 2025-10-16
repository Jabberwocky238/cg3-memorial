import type { ApiResponse } from "./base";
import { apiRequest } from "./base";

export interface User {
    uid: string;
    created_at: string;
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

const userApi = {
    createUser,
    getUser,
    updateUser,
}

export default userApi;