import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

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


    return (
        <div className="space-y-4">
            <SimpleEditor />
        </div>
    )
}


