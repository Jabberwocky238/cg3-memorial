export interface Users {
    uid: string
    created_at: string
}

export async function createUser(env: Env, uid: string): Promise<Users> {
    const now = new Date().toISOString()
    const user: Users = { uid, created_at: now }
    await env.DB.prepare(
        `INSERT INTO users (uid, created_at) VALUES (?, ?)`
    ).bind(uid, now).run()
    return user
}

export async function updateUser(env: Env, uid: string): Promise<Users | null> {
    const now = new Date().toISOString()
    const fields: string[] = []
    const binds: unknown[] = []
    fields.push('created_at = ?')
    binds.push(now)
    binds.push(uid)
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE uid = ?`
    const info = await env.DB.prepare(sql).bind(...binds).run()
    if ((info.meta.changes ?? 0) === 0) return null
    return await getUser(env, uid)
}

export async function getUser(env: Env, uid: string): Promise<Users | null> {
    const user = await env.DB.prepare(
        `SELECT uid, created_at FROM users WHERE uid = ?`
    ).bind(uid).first<Users>()
    return user ?? null
}

export async function existsUser(env: Env, uid: string): Promise<boolean> {
    const user = await getUser(env, uid)
    return user !== null
}
