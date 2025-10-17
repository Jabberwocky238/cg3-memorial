export interface ArTxRecord {
    id: number;
    tx_id: string;
    uid: string;
    created_at: Date;
    content_type: string;
    headers: string;
    content: File;
    msg_type: string;
}

export async function createArTxRecord(env: Env, 
    tx_id: string, 
    uid: string, 
    content_type: string, 
    headers: string, 
    content: File, 
    msg_type: string
): Promise<void> {
    const BLOB_CONTENT = await content.arrayBuffer()
    await env.DB.prepare(       
        `INSERT INTO ar_tx_record (tx_id, uid, content_type, headers, content, msg_type) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(tx_id, uid, content_type, headers, BLOB_CONTENT, msg_type).run()
}

export async function getArTxRecord(env: Env, tx_id: string): Promise<ArTxRecord | null> {
    const result = await env.DB.prepare(
        `SELECT id, tx_id, uid, created_at, content_type, headers, content, msg_type FROM ar_tx_record WHERE tx_id = ?`
    ).bind(tx_id).first<ArTxRecord>()
    return result ?? null
}

export async function listArTxRecordsByUid(env: Env, uid: string): Promise<ArTxRecord[]> {
    const { results } = await env.DB.prepare(
        `SELECT id, tx_id, uid, created_at, content_type, headers, content, msg_type FROM ar_tx_record WHERE uid = ? ORDER BY created_at DESC`
    ).bind(uid).all<ArTxRecord>()
    return results ?? []
}

export async function listArTxRecordsByMsgType(env: Env, msg_type: string): Promise<ArTxRecord[]> {
    const { results } = await env.DB.prepare(
        `SELECT id, tx_id, uid, created_at, content_type, headers, content, msg_type FROM ar_tx_record WHERE msg_type = ? ORDER BY created_at DESC`
    ).bind(msg_type).all<ArTxRecord>()
    return results ?? []
}

export async function deleteArTxRecord(env: Env, tx_id: string): Promise<boolean> {
    const result = await env.DB.prepare(
        `DELETE FROM ar_tx_record WHERE tx_id = ?`
    ).bind(tx_id).run()
    return (result.meta.changes ?? 0) > 0
}

export type Article = {
    aid: string;
    uid: string;
    title: string;
    poster: string;
    content: string;
    created_at: Date;
    updated_at: Date;
    chain: string;
    tags: string;
}

export async function updateArticle(env: Env, article: Omit<Article, 'created_at' | 'updated_at' | 'aid'>): Promise<string> {
    if ('aid' in article) {
        // create new article
        await env.DB.prepare(
            `UPDATE articles SET uid = ?, title = ?, poster = ?, content = ?, chain = ?, tags = ? WHERE aid = ?`
        ).bind(article.uid, article.title, article.poster, article.content, article.chain, article.tags, article['aid']).run()
        return article['aid'] as string;
    }
    const aid = crypto.randomUUID();
    await env.DB.prepare(
        `INSERT INTO articles (aid, uid, title, poster, content, chain, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(aid, article.uid, article.title, article.poster, article.content, article.chain, article.tags).run()
    return aid;
}

export async function getArticle(env: Env, aid: string): Promise<Article | null> {
    const result = await env.DB.prepare(
        `SELECT aid, uid, title, poster, content, created_at, updated_at, chain, tags FROM articles WHERE aid = ?`
    ).bind(aid).first<Article>()
    return result ?? null
}

export async function listArticles(env: Env): Promise<Article[]> {
    const { results } = await env.DB.prepare(
        `SELECT aid, uid, title, poster, content, created_at, updated_at, chain, tags FROM articles ORDER BY created_at DESC`
    ).all<Article>()
    return results ?? []
}