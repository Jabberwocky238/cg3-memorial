export interface ArTxRecord {
    id: number;
    tx_id: string;
    uid: string;
    created_at: Date;
    content_type: string;
    headers: string;
    content: File;
}

export async function createArTxRecord(env: Env, tx_id: string, uid: string, content_type: string, headers: string, content: File) {
    await env.DB.prepare(       
        `INSERT INTO ar_tx_record (tx_id, uid, created_at, content_type, headers, content) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(tx_id, uid, new Date(), content_type, headers, content).run()
}

export async function getArTxRecord(env: Env, tx_id: string): Promise<ArTxRecord | null> {
    const result = await env.DB.prepare(
        `SELECT id, tx_id, uid, created_at, content_type, headers, content FROM ar_tx_record WHERE tx_id = ?`
    ).bind(tx_id).first<ArTxRecord>()
    return result ?? null
}

export async function listArTxRecordsByUid(env: Env, uid: string): Promise<ArTxRecord[]> {
    const { results } = await env.DB.prepare(
        `SELECT id, tx_id, uid, created_at, content_type, headers, content FROM ar_tx_record WHERE uid = ? ORDER BY created_at DESC`
    ).bind(uid).all<ArTxRecord>()
    return results ?? []
}

export async function deleteArTxRecord(env: Env, tx_id: string): Promise<boolean> {
    const result = await env.DB.prepare(
        `DELETE FROM ar_tx_record WHERE tx_id = ?`
    ).bind(tx_id).run()
    return (result.meta.changes ?? 0) > 0
}