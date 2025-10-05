import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import { useApi } from '@/hooks/use-backend'
import { Archive, ArrowBlockUp, Edit03, Trash01 } from "@untitledui/icons";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { useEditorLifetime } from '@/hooks/use-editor-lifetime'
import { useArweave } from '@/hooks/use-arweave'
import { useIsMobile } from '@/hooks/tiptap/use-mobile'
import { useWindowSize } from '@/hooks/tiptap/use-window-size'
import { useCursorVisibility } from '@/hooks/tiptap/use-cursor-visibility'
import { EditorContext, EditorContent } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar/toolbar'
import { MainToolbarContent } from '@/components/tiptap-templates/simple/simple-editor'
import { MobileToolbarContent } from '@/components/tiptap-templates/simple/simple-editor'

function EditPage() {
    const { aid } = useParams()
    const { user } = useFirebase()
    const { createTx } = useArweave()
    const { createArticle, getArticle } = useApi()
    const { editor } = useEditorLifetime(true)
    const [title, setTitle] = useState('Untitled')
    const [contentLoaded, setContentLoaded] = useState(false)

    const loadArticle = async () => {
        if (!aid || !editor || contentLoaded) return
        console.log('Edit: 开始加载文章', aid)
        const result = await getArticle(aid)
        if (result.data) {
            console.log('Edit: 文章数据加载成功', result.data)
            setTitle(result.data.title ?? 'Untitled')
            const content = JSON.parse(result.data.content ?? '{}')
            editor.commands.setContent(content)
            setContentLoaded(true)
            console.log('Edit: 编辑器内容已设置')
        }
    }

    useEffect(() => {
        try {
            loadArticle()
        } catch (error) {
            console.error('Edit: 加载文章失败', error)
        }
    }, [aid, editor, contentLoaded])

    useEffect(() => {
        if (!editor) return
        const timer = setInterval(() => {
            // 找到第一个type: heading, attr: level: 1, 的text
            const heading = editor.state.doc.content.content.find((node) => {
                const type = node.type
                const attrs = node.attrs
                return type.name === 'heading' && attrs.level === 1
            })
            if (!heading) {
                setTitle('Untitled')
                return
            }
            setTitle(heading?.content.content[0].text ?? 'Untitled')
        }, 1000)
        return () => clearInterval(timer)
    }, [editor])


    return (
        <div className="space-y-4">
            <ButtonGroup className="w-full justify-center" selectedKeys={[]}>
                <ButtonGroupItem id="archive" iconLeading={Archive} onClick={() => {
                    console.log(editor?.state.doc.content)
                }}>
                    Log Content
                </ButtonGroupItem>
                <ButtonGroupItem id="edit" iconLeading={Edit03} onClick={() => {
                    console.log(editor?.getJSON())
                }}>
                    Log JSON
                </ButtonGroupItem>
                <ButtonGroupItem id="edit" iconLeading={Trash01} onClick={() => {
                    editor?.commands.setContent('')
                }}>
                    Clean Content
                </ButtonGroupItem>
                <ButtonGroupItem id="publish" iconLeading={ArrowBlockUp} onClick={async () => {
                    const json = editor?.getJSON()
                    await createArticle(user?.uid ?? '', title, JSON.stringify(json))
                }}>
                    Publish
                </ButtonGroupItem>
                <ButtonGroupItem id="upchain" iconLeading={ArrowBlockUp} onClick={async () => {
                    const html = editor?.getHTML()
                    if (html) {
                        const tx = await createTx(html, [['Content-Type', 'text/html']])
                        console.log('Upchain: 交易创建成功', tx, html)
                    } else {
                        console.error('Upchain: 编辑器内容为空')
                    }
                }}>
                    Upchain
                </ButtonGroupItem>
            </ButtonGroup>
            {editor && <MySimpleEditor editor={editor} />}
        </div>
    )
}


export default function EditPageWrapper() {
    return (
        <EditPage />
    )
}


function MySimpleEditor({ editor }: { editor: Editor | null }) {
    const isMobile = useIsMobile()
    const { height } = useWindowSize()
    const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main")
    const toolbarRef = useRef<HTMLDivElement>(null)
    const rect = useCursorVisibility({
      editor,
      overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
    })
  
    useEffect(() => {
      if (!isMobile && mobileView !== "main") {
        setMobileView("main")
      }
    }, [isMobile, mobileView])
  
    return (
      <div className="simple-editor-wrapper">
        <EditorContext.Provider value={{ editor }}>
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
  
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />
        </EditorContext.Provider>
      </div>
    )
  }
  