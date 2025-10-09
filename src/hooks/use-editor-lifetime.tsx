import { useEditor } from "@tiptap/react"

// 导入编辑器配置
import { StarterKit } from "@tiptap/starter-kit"
import { Image, type ImageOptions } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"

import "@/components/tiptap-templates/simple/simple-editor.scss"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import { useMemo } from "react"
import { useLocation } from "react-router-dom"

export function useEditorLifetime(editable: boolean = true) {
    const location = useLocation()
    const editor = useEditor({
        immediatelyRender: false, // 立即渲染，避免null
        shouldRerenderOnTransaction: false,
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
            } as Partial<ImageOptions>),
            ImageUploadNode.configure({
                upload: async (file: File, onProgress, signal) => {
                   return await base64Image(file) as string
                },
                onSuccess: (url) => {
                    console.log('图片上传成功:', url);
                },
                onError: (error) => {
                    console.error('图片上传失败:', error);
                },
                maxSize: 5 * 1024 * 1024,
                limit: 1,
                accept: 'image/*',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Selection,
        ],
        // onUpdate: () => {
        //     // 可以在这里添加更新逻辑
        // },
    })

    const memoEditor = useMemo(() => {
        if (!editor) return null
        const isEditable = editor.isEditable
        if (isEditable !== editable) {
            editor.setEditable(editable, false)
        }
        editor.commands.setContent('')
        return editor
    }, [editor, editable, location])

    return { editor: memoEditor }
}

async function base64Image(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            resolve(reader.result as string)
        }
        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }
        reader.readAsDataURL(file)
    })
}
