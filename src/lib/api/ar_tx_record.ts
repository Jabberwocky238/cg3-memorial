import { apiRequest } from "./base";
import type { ApiResponse } from "./base";

export interface ArTxRecord {
    id: number;
    tx_id: string;
    uid: string;
    created_at: Date;
    content_type: string;
    headers: string;
    content: File;
}

async function createArTxRecord(tx_id: string, uid: string, content_type: string, headers: string, content: File): Promise<ApiResponse<ArTxRecord>> {
    const formData = new FormData();
    formData.append('tx_id', tx_id);
    formData.append('uid', uid);
    formData.append('content_type', content_type);
    formData.append('headers', headers);
    formData.append('content', content);
    return apiRequest<ArTxRecord>('/ar_tx_records', {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        body: formData,
    });
}

async function getArTxRecord(tx_id: string): Promise<ApiResponse<ArTxRecord>> {
    return apiRequest<ArTxRecord>(`/ar_tx_records/${encodeURIComponent(tx_id)}`);
}

async function listArTxRecordsByUid(uid: string): Promise<ApiResponse<ArTxRecord[]>> {
    return apiRequest<ArTxRecord[]>(`/ar_tx_records/by_uid/${encodeURIComponent(uid)}`);
}   

async function deleteArTxRecord(tx_id: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`/ar_tx_records/${encodeURIComponent(tx_id)}`, {
        method: 'DELETE',
    });
}

const arTxRecordApi = {
    create: createArTxRecord,
    get: getArTxRecord,
    list: listArTxRecordsByUid,
    delete: deleteArTxRecord,
}

export default arTxRecordApi;