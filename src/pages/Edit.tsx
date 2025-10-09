import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import { useApi } from '@/hooks/use-backend'
import { useArweave } from '@/hooks/use-arweave'
import { useTheme } from '@/hooks/use-theme'
import { Archive, ArrowBlockUp, ArrowBlockDown, Edit03, Trash01, CheckCircle } from "@untitledui/icons";
import { useEditorLifetime } from '@/hooks/use-editor-lifetime'
import { useIsMobile } from '@/hooks/tiptap/use-mobile'
import { useWindowSize } from '@/hooks/tiptap/use-window-size'
import { useCursorVisibility } from '@/hooks/tiptap/use-cursor-visibility'
import { EditorContext, EditorContent } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar/toolbar'
import { MainToolbarContent } from '@/components/tiptap-templates/simple/simple-editor'
import { MobileToolbarContent } from '@/components/tiptap-templates/simple/simple-editor'
import { GeneralPortal, MobilePortal, ModalButton } from '@/components/application/app-navigation/base-components/mobile-header';
import { CloseIcon } from '@/components/tiptap-icons/close-icon'
import { Button } from '@/components/base/buttons/button'
import { isUUID, useAppState } from '@/hooks/use-app-state'
import { ButtonUtility } from '@/components/base/buttons/button-utility'

function EditPage() {
  const { aid } = useParams()
  const { userFirebase } = useFirebase()
  const { getArticle } = useApi()
  const { editor } = useEditorLifetime(true)
  const contentRef = useRef<string | null>(null)
  const { LOG_append, LOG_clear, setError } = useAppState()

  const tryLoadArticle = async (aid: string) => {
    if (contentRef.current) return
    console.log('Edit: 开始加载文章', aid)
    const result = await getArticle(aid)
    if (result.data) {
      const isBelongToUser = result.data.uid === userFirebase?.uid
      console.log('Edit: 文章数据加载成功', result.data)
      contentRef.current = JSON.parse(result.data.content ?? '{}')
      return { isBelongToUser }
    }
    return { isBelongToUser: false }
  }

  useEffect(() => {
    if (!editor) return
    if (!contentRef.current) return
    editor.commands.setContent(contentRef.current)
  }, [editor, contentRef.current])

  useEffect(() => {
    if (!aid) return // 如果文章 ID 为空，则认为创建新文章
    if (!isUUID(aid)) {
      setError('Edit: 文章 ID 无效' + aid)
      return
    }
    console.log('Edit: 检查文章是否属于用户', aid)
    LOG_append('Edit: 检查文章是否属于用户' + aid)
    tryLoadArticle(aid).then(isBelongToUser => {
      if (!isBelongToUser) {
        setError('Edit: 文章不属于您，您只能查看，不能编辑。' + aid)
        return
      }
      LOG_clear()
    }).catch((error) => {
      console.error('Edit: 检查文章是否属于用户失败', error)
      setError('Edit: 加载失败' + error)
      return
    })
  }, [aid])

  return (
    <div className="space-y-4 relative">
      <ControlPanelContainer editor={editor} />
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
          data-variant="fixed"
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

function ControlPanelContainer({ editor }: { editor: Editor | null }) {
  const hiddenClassPair = ["lg:hidden", "max-lg:hidden"]
  return (
    <>
      <MobilePortal OpenIcon={ArrowBlockUp} CloseIcon={CloseIcon} hiddenClass={hiddenClassPair[0]}>
        <ControlPanel editor={editor} />
      </MobilePortal>
      <div
        className={`fixed left-8 bottom-8 
          bg-gray-100 dark:bg-gray-800
          transform rounded-lg
          border border-secondary 
          z-30 overflow-hidden 
          ${hiddenClassPair[1]}`}
        style={{ width: '22vw', height: '70%' }}
      >
        <ControlPanel editor={editor} />
      </div>
    </>
  )
}

interface ControlPanelProps {
  editor: Editor | null
  className?: string
}

function ControlPanel({ className, editor }: ControlPanelProps) {
  const { aid } = useParams()
  const { userFirebase } = useFirebase()
  const { createArticle, updateArticle } = useApi()
  const { createTx } = useArweave()
  const { theme } = useTheme()
  const [title, setTitle] = useState('Untitled')

  // 监听编辑器内容变化，更新标题
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

  // 处理日志内容
  const handleLogContent = () => {
    console.log(editor?.state.doc.content)
  }

  // 处理日志JSON
  const handleLogJSON = () => {
    console.log(editor?.getJSON())
  }

  // 处理日志HTML
  const handleLogHTML = () => {
    console.log(editor?.getHTML())
  }

  // 处理清空内容
  const handleCleanContent = () => {
    editor?.commands.setContent('')
  }

  // 处理发布文章
  const [isPublishing, setIsPublishing] = useState(false)
  const handlePublish = async () => {
    if (!editor || !userFirebase) return

    setIsPublishing(true)
    try {
      const json = editor.getJSON()
      if (aid) {
        await updateArticle(aid, title, JSON.stringify(json))
        alert('文章更新成功')
      } else {
        await createArticle(userFirebase.uid, title, JSON.stringify(json))
        alert('文章创建成功')
      }
      console.log('文章发布成功')
    } catch (error) {
      console.error('发布文章失败:', error)
      alert('发布文章失败: ' + error)
    } finally {
      setIsPublishing(false)
    }
  }

  // 处理上链
  const [isUpchaining, setIsUpchaining] = useState(false)
  const handleUpchain = async () => {
    if (!editor) return

    const html = editor.getHTML()
    if (!html) {
      console.error('Upchain: 编辑器内容为空')
      alert('编辑器内容为空，无法上链')
      return
    }

    setIsUpchaining(true)
    try {
      const template = templateMake(html, title, theme === 'dark')
      const { tx, res } = await createTx(template, [
        ['Content-Type', 'text/html'],
        ['Title', title],
        ['Type', 'file'],
        ['User-Agent', 'Permane-Inc'],
      ])
      console.log('Upchain: 交易创建成功', tx, res, template)
      alert("文章已上链: https://arweave.net/" + tx.id)
    } catch (error) {
      console.error('Upchain: 交易创建失败', error)
      alert('上链失败: ' + error)
    } finally {
      setIsUpchaining(false)
    }
  }

  return (
    <div className={`h-full w-full p-4 space-y-4 bg-primary ${className}`}>
      <div className="text-xs">
        <p>文章标题: {title}</p>
        <p className="break-all truncate">文章ID: {aid}</p>
        <p>上链状态: {isUpchaining ? '上链中...' : '未上链'}</p>
      </div>

      <div className="grid max-lg:grid-cols-3 lg:grid-cols-1 gap-2 ">
        <Button
          isLoading={false} showTextWhileLoading iconLeading={Archive}
          color="secondary" size="sm" onClick={handleLogContent}
        >
          Log Content
        </Button>
        <Button
          isLoading={false} showTextWhileLoading iconLeading={Archive}
          color="secondary" size="sm" onClick={handleLogJSON}
        >
          Log JSON
        </Button>
        <ModalButton
          title="Log HTML"
          tooltip="Log HTML"
          iconLeading={Archive}
          color="secondary" size="sm"
          onClick={handleLogHTML}
          forceRefresh
          actions={[
            {
              label: "Close",
              onClick: (close) => {close()},
              icon: CloseIcon,
            },
          ]}
        >
          <pre className="p-4 rounded break-words whitespace-pre-wrap overflow-auto">
            {JSON.stringify(editor?.getHTML(), null, 2)}
          </pre>
        </ModalButton>
        {/* <Button
          isLoading={false} showTextWhileLoading iconLeading={Archive}
          color="secondary" size="sm" onClick={handleLogHTML}
        >
          Log HTML
        </Button> */}
        <Button
          isLoading={false} showTextWhileLoading iconLeading={Archive}
          color="secondary" size="sm" onClick={handleCleanContent}
        >
          Clear Content
        </Button>
        <Button
          isLoading={isPublishing} showTextWhileLoading iconLeading={CheckCircle}
          color="secondary" size="sm" onClick={handlePublish}
        >
          Publish
        </Button>
        <Button
          isLoading={isUpchaining} showTextWhileLoading iconLeading={Archive}
          color="secondary" size="sm" onClick={handleUpchain}
        >
          Upchain
        </Button>
      </div>
    </div>
  )
}

function templateMake(html: string, title: string, isDark: boolean) {
  return `<!doctype html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="https://cdn4.iconfinder.com/data/icons/glyphs/24/icons_user-1024.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" crossorigin href="/J2y9GHRusiCDDoh4vZoF2xMzf7ueAIQfPVWfnxhgbCE">
</head>
<body class="${isDark ? 'dark-mode' : ''}">
 <div class="simple-editor-content">
  <div class="tiptap ProseMirror simple-editor">
    ${html}
  </div>
 </div>
</body>
</html>`
}


