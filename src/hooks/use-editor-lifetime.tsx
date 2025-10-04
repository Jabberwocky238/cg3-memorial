import { useEditor } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { useEffect, useState } from "react"

// 导入编辑器配置
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"

export function useEditorLifetime(modifiable: boolean = true) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
        editable: modifiable,
        editorProps: {
            attributes: {
                autocomplete: "off",
                autocorrect: "off",
                autocapitalize: "off",
                "aria-label": "Main content area, start typing to enter text.",
                class: "simple-editor",
            },
        },
        extensions: [
            StarterKit.configure({
                horizontalRule: false,
                link: {
                    openOnClick: false,
                    enableClickSelection: true,
                },
            }),
            HorizontalRule,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Typography,
            Highlight.configure({ multicolor: true }),
            Subscript,
            Superscript,
            Image.configure({
                HTMLAttributes: {
                    class: "simple-editor-image",
                },
            }),
            ImageUploadNode,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Selection,
        ],
        onUpdate: () => {
            // 可以在这里添加更新逻辑
        },
    })

    useEffect(() => {
        if (editor) {
            console.log('Editor: 编辑器创建成功', editor)
            setLoading(false)
            setError(null)
        } else {
            console.log('Editor: 编辑器创建中...')
            setLoading(true)
        }
    }, [editor])

    return {
        editor,
        loading,
        error,
    }
}