import { createArticle, deleteArticle, getArticleById, listArticles, updateArticle } from './db'
import { middlewareReadJson, responseJson } from './utils'

function _parseArticleIdFromUrl(request: Request): string | null {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/api\/articles\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function handleListArticles(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const items = await listArticles(env)
  return await responseJson({ data: items })
}

export async function handleCreateArticle(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const body = await middlewareReadJson<{ uid?: string; title?: string; content?: string; tags?: string }>(request)
  if (!body.uid || !body.title || !body.content) {
    return await responseJson({ error: 'uid, title, content are required' }, { status: 400 })
  }
  const created = await createArticle(env, body.uid, body.title, body.content, body.tags ?? '{}')
  return await responseJson({ data: created }, { status: 201 })
}

export async function handleGetArticle(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const aid = _parseArticleIdFromUrl(request)
  if (!aid) return await responseJson({ error: 'Bad Request' }, { status: 400 })
  const item = await getArticleById(env, aid)
  if (!item) return await responseJson({ error: 'Not Found' }, { status: 404 })
  return await responseJson({ data: item })
}

export async function handleUpdateArticle(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const aid = _parseArticleIdFromUrl(request)
  if (!aid) return await responseJson({ error: 'Bad Request' }, { status: 400 })
  const body = await middlewareReadJson<{ title?: string; content?: string; tags?: string }>(request)
  if (body.title === undefined && body.content === undefined) {
    return await responseJson({ error: 'Nothing to update' }, { status: 400 })
  }
  const updated = await updateArticle(env, aid, body.title, body.content, body.tags)
  if (!updated) return await responseJson({ error: 'Not Found' }, { status: 404 })
  return await responseJson({ data: updated })
}

export async function handleDeleteArticle(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const aid = _parseArticleIdFromUrl(request)
  if (!aid) return await responseJson({ error: 'Bad Request' }, { status: 400 })
  const ok = await deleteArticle(env, aid)
  if (!ok) return await responseJson({ error: 'Not Found' }, { status: 404 })
  return new Response(null, { status: 204 })
}
