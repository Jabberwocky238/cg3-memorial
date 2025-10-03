export interface Articles {
  aid: string
  uid: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export async function listArticles(env: Env): Promise<Articles[]> {
  const { results } = await env.DB.prepare(
    `SELECT aid, uid, title, content, created_at, updated_at
     FROM articles
     ORDER BY created_at DESC`
  ).all<Articles>()
  return results ?? []
}

export async function getArticleById(env: Env, aid: string): Promise<Articles | null> {
  const row = await env.DB.prepare(
    `SELECT aid, uid, title, content, created_at, updated_at
     FROM articles
     WHERE aid = ?`
  ).bind(aid).first<Articles>()
  if (Array.isArray(row)) {
    return row[0] ?? null
  }
  return row ?? null
}

export async function createArticle(env: Env, uid: string, title: string, content: string): Promise<Articles> {
  const now = new Date().toISOString()
  const aid = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO articles (aid, uid, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(aid, uid, title, content, now, now).run()
  const created = await getArticleById(env, aid)
  if (!created) throw new Error('Failed to insert article')
  return created
}

export async function updateArticle(env: Env, aid: string, title?: string, content?: string): Promise<Articles | null> {
  if (title === undefined && content === undefined) {
    return await getArticleById(env, aid)
  }
  const fields: string[] = []
  const binds: unknown[] = []
  if (title !== undefined) {
    fields.push('title = ?')
    binds.push(title)
  }
  if (content !== undefined) {
    fields.push('content = ?')
    binds.push(content)
  }
  const now = new Date().toISOString()
  fields.push('updated_at = ?')
  binds.push(now)
  binds.push(aid)

  const sql = `UPDATE articles SET ${fields.join(', ')} WHERE aid = ?`
  const info = await env.DB.prepare(sql).bind(...binds).run()
  if ((info.meta.changes ?? 0) === 0) return null
  return await getArticleById(env, aid)
}

export async function deleteArticle(env: Env, aid: string): Promise<boolean> {
  const info = await env.DB.prepare(
    `DELETE FROM articles WHERE aid = ?`
  ).bind(aid).run()
  return (info.meta.changes ?? 0) > 0
}

