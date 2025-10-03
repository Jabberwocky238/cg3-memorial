import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import { createSimpleEditor, SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { useApi } from '@/hooks/use-backend'
import { Archive, ArrowBlockUp, Edit03, Trash01 } from "@untitledui/icons";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";

type ApiArticle = {
    aid: string
    uid: string
    title: string
    content: string
    created_at: string
    updated_at: string
}


function EditPage() {
    const { aid } = useParams()
    const { user } = useFirebase()
    const editor = createSimpleEditor()
    const { createArticle } = useApi()
    const [title, setTitle] = useState('Untitled')

    useEffect(() => {
        const timer = setInterval(() => {
            if (editor) {
                // 找到第一个type: heading, attr: level: 1, 的text
                const heading = editor?.state.doc.content.content.find((node) => {
                    const type = node.type
                    const attrs = node.attrs
                    return type.name === 'heading' && attrs.level === 1
                })
                if (!heading) {
                    setTitle('Untitled')
                    return
                }
                setTitle(heading?.content.content[0].text ?? 'Untitled')
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [editor])

    return (
        <div className="space-y-4">
            <ButtonGroup className="w-full justify-center" selectedKeys={[]}>
                <ButtonGroupItem id="archive" iconLeading={Archive} onClick={() => {
                    console.log(editor?.state.doc.content)
                }}>
                    console.Log Content
                </ButtonGroupItem>
                <ButtonGroupItem id="edit" iconLeading={Edit03} onClick={() => {
                    console.log(editor?.getJSON())
                }}>
                    console.Log JSON
                </ButtonGroupItem>
                <ButtonGroupItem id="edit" iconLeading={Trash01} onClick={() => {
                    editor?.commands.setContent('')
                }}>
                    Clean Content
                </ButtonGroupItem>
                <ButtonGroupItem id="publish" iconLeading={ArrowBlockUp} onClick={async () => {
                    if (editor) {
                        const json = editor.getJSON()
                        await createArticle(user?.uid ?? '', title, JSON.stringify(json))
                    }
                }}>
                    Publish
                </ButtonGroupItem>
            </ButtonGroup>
            {editor && <SimpleEditor editor={editor} modifiable />}
        </div>
    )
}


export default function EditPageWrapper() {
    return (
        <EditPage />
    )
}