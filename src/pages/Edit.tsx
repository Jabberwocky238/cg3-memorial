import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import Tiptap from '@/components/TipTap'

type ApiArticle = {
    aid: string
    uid: string
    title: string
    content: string
    created_at: string
    updated_at: string
}

export default function EditPage() {
    const { aid } = useParams()
    const navigate = useNavigate()
    const { auth, user } = useFirebase()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isNew = useMemo(() => !aid || aid === 'new', [aid])

    useEffect(() => {
        let aborted = false
        // 暂时去掉对现有文章的重编辑：如果不是新建，直接提示并跳转回首页
        if (aid && !isNew && !aborted) {
            setError('暂不支持编辑已有文章')
            navigate('/')
        }
        return () => { aborted = true }
    }, [aid, isNew, navigate])

    const handleSave = useCallback(async () => {
        if (!auth.currentUser) {
            navigate('/auth')
            return
        }
        if (!title.trim()) {
            setError('标题不能为空')
            return
        }
        setSaving(true)
        setError(null)
        try {
            if (!isNew) {
                setError('暂不支持编辑已有文章')
                return
            }
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: auth.currentUser.uid, title, content }),
            })
            if (!res.ok) throw new Error('创建失败')
            const json = await res.json() as { data?: ApiArticle; error?: string }
            if (!json.data) throw new Error(json.error || '创建失败')
            navigate(`/edit/${json.data.aid}`)
        } catch (e: any) {
            setError(e?.message || '保存失败')
        } finally {
            setSaving(false)
        }
    }, [auth.currentUser, title, content, isNew, aid, navigate])

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">{isNew ? '新建文章' : '编辑文章'}</h1>
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                        disabled={saving}
                        onClick={handleSave}
                    >{saving ? '保存中...' : '保存'}</button>
                </div>
            </div>

            {error ? (
                <div className="text-sm text-red-600">{error}</div>
            ) : null}

            <div className="space-y-2">
                <Tiptap />
            </div>

            {loading ? (
                <div className="text-sm text-zinc-500">加载中...</div>
            ) : null}
        </div>
    )
}


