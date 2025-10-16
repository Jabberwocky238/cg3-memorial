import { createArTxRecord, deleteArTxRecord, getArTxRecord, listArTxRecordsByUid } from "../db"
import { middlewareReadJson, responseJson } from "../utils"

function _parseUidFromUrl(request: Request): string | null {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/api\/ar_tx_records\/by_uid\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
}

function _parseTxIdFromUrl(request: Request): string | null {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/api\/ar_tx_records\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
}

export async function handleCreateArTxRecord(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const body = await middlewareReadJson<{ tx_id: string; uid: string; content_type: string; headers: string; content: File }>(request)
    if (!body.tx_id || !body.uid || !body.content_type || !body.headers || !body.content) {
        return await responseJson({ error: 'tx_id, uid, content_type, headers, content are required' }, { status: 400 })
    }
    const created = await createArTxRecord(env, body.tx_id, body.uid, body.content_type, body.headers, body.content)
    return await responseJson({ data: created }, { status: 201 })
}

export async function handleGetArTxRecord(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const tx_id = _parseTxIdFromUrl(request)
    if (!tx_id) return await responseJson({ error: 'Bad Request' }, { status: 400 })
    const item = await getArTxRecord(env, tx_id)
    if (!item) return await responseJson({ error: 'Not Found' }, { status: 404 })
    return await responseJson({ data: item })
}

export async function handleListArTxRecordsByUid(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const uid = _parseUidFromUrl(request)
    if (!uid) return await responseJson({ error: 'Bad Request' }, { status: 400 })
    const items = await listArTxRecordsByUid(env, uid)
    return await responseJson({ data: items })
}

export async function handleDeleteArTxRecord(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const tx_id = _parseTxIdFromUrl(request)
    if (!tx_id) return await responseJson({ error: 'Bad Request' }, { status: 400 })
    const ok = await deleteArTxRecord(env, tx_id)
    if (!ok) return await responseJson({ error: 'Not Found' }, { status: 404 })
    return new Response(null, { status: 204 })
}