import { useEditor } from "@tiptap/react"
import { Editor } from "@tiptap/react"
import { useEffect, useRef, useState } from "react"

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
import { useAppState } from "./use-app-state"

export function useEditorLifetime(modifiable: boolean = true) {
    const editorRef = useRef<Editor | null>(null)
    const { LOG_append, LOG_clear, setError } = useAppState()

    useEffect(() => {
        if (editorRef.current) {
            LOG_append('Editor: 编辑器已存在 检查参数')
            editorRef.current.setEditable(modifiable, false)
            editorRef.current.commands.setContent('')
            LOG_clear()
            setError(null)
        } else {
            LOG_append('Editor: 编辑器创建中...')
            editorRef.current = useEditor({
                immediatelyRender: true, // 立即渲染，避免null
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
            LOG_clear()
        }
    }, [modifiable])

    return { editor: editorRef.current }
}