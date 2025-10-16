import { useEffect, useState, useRef, type RefObject, useContext } from 'react'
import type { Key } from '@react-types/shared'
import { useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import api from '@/lib/api'
import { useArweave } from '@/hooks/use-arweave'
import { useTheme } from '@/hooks/use-theme'
import { Archive, ArrowBlockUp, ArrowBlockDown, Edit03, Trash01, CheckCircle, XClose } from "@untitledui/icons";
import { useEditorLifetime } from '@/hooks/use-editor-lifetime'
import { useIsMobile } from '@/hooks/tiptap/use-mobile'
import { useWindowSize } from '@/hooks/tiptap/use-window-size'
import { useCursorVisibility } from '@/hooks/tiptap/use-cursor-visibility'
import { EditorContext, EditorContent, type JSONContent } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { Toolbar } from '@/components/tiptap-ui-primitive/toolbar/toolbar'
import { MainToolbarContent } from '@/components/tiptap-templates/simple/simple-editor'
import { MobileToolbarContent } from '@/components/tiptap-templates/simple/simple-editor'
import { GeneralPortal, MobilePortal, ModalButton } from '@/components/application/app-navigation/base-components/mobile-header';
import { CloseIcon } from '@/components/tiptap-icons/close-icon'
import { Button } from '@/components/base/buttons/button'
import { isUUID, useAppState } from '@/hooks/use-app-state'
import { Tag, TagGroup, type TagItem, TagList } from "@/components/base/tags/tags";
import { Input } from "@/components/base/input/input";
import { Select, type SelectItemType } from "@/components/base/select/select";
import { ButtonGroup, ButtonGroupItem } from '@/components/base/button-group/button-group'
import { ArticleMetaPanel, type ArticleMetaPanelProps } from '@/components/cg-ui/ArticleMetaPanel'
import { type ArticleData, ArticleClass, type TagTreeType } from '@/lib/article-class'
import { createContext } from 'react'

const EditContext = createContext<{
  articleRef: RefObject<ArticleClass>
} | null>(null)


export default function EditPageWrapper() {
  const articleRef = useRef<ArticleClass>(new ArticleClass())
  return (
    <EditContext.Provider value={{ articleRef }}>
      <EditPage />
    </EditContext.Provider>
  )
}

function useEditContext() {
  const context = useContext(EditContext)
  if (!context) {
    throw new Error('useEditContext must be used within an EditContext.Provider')
  }
  return context
}

function EditPage() {
  const { aid } = useParams()
  const { userFirebase } = useFirebase()
  const { editor } = useEditorLifetime(true)
  const { articleRef } = useEditContext()
  const { LOG_append, LOG_clear, setError } = useAppState()

  const tryLoadArticle = async (aid: string) => {
    console.log('Edit: 开始加载文章', aid)
    const result = await api.article.get(aid)
    if (result.data) {
      const isBelongToUser = result.data.uid === userFirebase?.uid
      console.log('Edit: 文章数据加载成功', result.data)
      articleRef.current.lock()
      articleRef.current.aid = result.data.aid
      articleRef.current.title = result.data.title
      articleRef.current.tags = JSON.parse(result.data.tags)
      articleRef.current.content = JSON.parse(result.data.content)
      articleRef.current.unlock()
      return { isBelongToUser }
    }
    return { isBelongToUser: false }
  }

  useEffect(() => {
    if (!editor) return
    if (!articleRef.current) return
    if (articleRef.current.isLocked) return
    editor.commands.setContent(articleRef.current.content)
  }, [editor, articleRef.current?.isLocked, articleRef.current?.content])

  useEffect(() => {
    if (!aid) { // 如果文章 ID 为空，则认为创建新文章
      // 清空文章数据
      articleRef.current.lock()
      articleRef.current.aid = ''
      articleRef.current.title = ''
      articleRef.current.tags = {}
      articleRef.current.content = {}
      articleRef.current.unlock()
      return
    }
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
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4 overflow-hidden justify-center">
        <div className="lg:w-5/8 max-lg:w-full overflow-auto bg-blue-500 border border-secondary rounded-lg">
          {editor && <MySimpleEditor editor={editor} />}
        </div>
        <ControlPanelContainer
          className="lg:w-2/8 max-lg:hidden overflow-auto dark:bg-red-800 bg-red-100"
          editor={editor}
        />
      </div>
    </div>
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
    <div className="h-full w-full overflow-hidden">
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

interface ControlPanelProps {
  className?: string
  editor: Editor | null
}

function ControlPanelContainer(props: ControlPanelProps) {
  const hiddenClassPair = ["lg:hidden", "max-lg:hidden"]
  const { className, ...rest } = props
  return (
    <>
      <MobilePortal OpenIcon={ArrowBlockUp} CloseIcon={CloseIcon} hiddenClass={hiddenClassPair[0]}>
        <ControlPanel {...rest} />
      </MobilePortal>
      <div
        className={`                  
            bg-gray-100 dark:bg-gray-800
            transform rounded-lg
            border border-secondary 
            z-30 overflow-hidden 
            ${hiddenClassPair[1]} ${className}`}
      >
        <ControlPanel {...rest} />
      </div>
    </>
  )
}

function ControlPanel({ className, editor }: ControlPanelProps) {
  const { articleRef } = useEditContext()
  const { createTx } = useArweave()
  const { theme } = useTheme()
  const [isDirty, setIsDirty] = useState(false)
  // 监听编辑器内容变化，更新标题
  useEffect(() => {
    if (!editor) return
    console.log('Edit: 监听编辑器内容变化')
    const timer = setInterval(() => {
      // 找到第一个type: heading, attr: level: 1, 的text
      const heading = editor.state.doc.content.content.find((node) => {
        const type = node.type
        const attrs = node.attrs
        return type.name === 'heading' && attrs.level === 1
      })
      if (!heading) {
        articleRef.current.title = 'Untitled'
        console.log('Edit: 未找到标题', articleRef.current.title)
        return
      }
      articleRef.current.title = heading?.content.content[0].text ?? 'Untitled'
      console.log('Edit: 找到标题', articleRef.current.title)
      setIsDirty(true)
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
      const template = templateMake(html, articleRef.current.title, theme === 'dark')
      const { tx, res } = await createTx(template, [
        ['Content-Type', 'text/html'],
        ['Title', articleRef.current.title],
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
    <div className={`h-full w-full p-4 space-y-4 ${className}`}>
      <ArticleMetaPanel article={articleRef.current} />

      <div className="grid max-lg:grid-cols-2 lg:grid-cols-1 gap-2 ">
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
              onClick: (close) => { close() },
              icon: CloseIcon,
            },
          ]}
        >
          <pre className="p-4 rounded break-words whitespace-pre-wrap overflow-auto">
            {JSON.stringify(editor?.getHTML(), null, 2)}
          </pre>
        </ModalButton>
        <ModalButton
          title="Tags"
          tooltip="Tags"
          iconLeading={Trash01}
          color="secondary" size="sm"
        >
          {(close) => <TagsPanel
            close={close}
            getTags={() => articleRef.current.tags}
            setTags={(tags) => {
              articleRef.current.tags = tags;
              setIsDirty(true)
            }}
          />}
        </ModalButton>
        <ModalButton
          title="Publish"
          tooltip="Publish"
          iconLeading={CheckCircle}
          color="secondary" size="sm"
        >
          {(close) => <ArticleMetaEditPanel close={close} article={articleRef.current} setIsDirty={setIsDirty} />}
        </ModalButton>
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

interface TagsPanelProps {
  close: () => void
  getTags: () => TagTreeType
  setTags: (tags: TagTreeType) => void
}

function TagsPanel({ close, getTags, setTags }: TagsPanelProps) {
  const validKeys = ['topic', 'date'].map((key) => ({ id: key, label: key })) satisfies SelectItemType[]
  const [chosenKey, setChosenKey] = useState<Key>(validKeys[0].id as Key)
  const [tagTree, setTagTree] = useState<TagTreeType>(getTags())

  useEffect(() => {
    setTagTree(getTags())
  }, [getTags])

  const [newTagValue, setNewTagValue] = useState<string>('')
  const [hintAndValid, setHintAndValid] = useState<{ hint: string, isInvalid: boolean }>({ hint: 'Input a new tag', isInvalid: false })

  return (
    <div className="space-y-4">
      {/* 添加新标签 */}
      <div className="flex items-center gap-2">
        <Select className='w-1/3' items={validKeys} value={chosenKey}
          isRequired
          hint='choose a key'
          onChange={(e) => {
            if (!e) return
            setChosenKey(e)
          }}
          label="Key">
          {(item) => (
            <Select.Item id={item.id} supportingText={item.supportingText} isDisabled={item.isDisabled} icon={item.icon} avatarUrl={item.avatarUrl}>
              {item.label}
            </Select.Item>
          )}
        </Select>
        <Input className='w-1/2' autoFocus isRequired hint={hintAndValid.hint} isInvalid={hintAndValid.isInvalid} value={newTagValue} onChange={(e) => setNewTagValue(e)} label="New Tag Value" />
        <Button className='w-1/6' onClick={() => {
          if (newTagValue === '') {
            setHintAndValid({ hint: 'Tag is empty', isInvalid: true })
            return
          }
          // 检查是否已存在相同标签名的分类
          const exists = tagTree[chosenKey]?.some(tag => tag === newTagValue)
          if (exists) {
            setHintAndValid({ hint: 'Tag already exists', isInvalid: true })
            return
          }
          tagTree[chosenKey] = [...(tagTree[chosenKey] ?? []), newTagValue]
          setNewTagValue('')
          setHintAndValid({ hint: 'Tag added', isInvalid: false })
        }}>Add</Button>
      </div>
      <div className="flex flex-col items-start gap-4">
        {Object.entries(tagTree).map(([key, value]) => (
          <div key={key} className="flex flex-col items-start gap-4 md:flex-row">
            {/* key部分 */}
            <TagGroup label={key + " Key"} size="md"
              onRemove={(keys: Set<Key>) => {
                const newtagtree = Object.entries(tagTree).filter(([key, values]) => !keys.has(key as Key)).reduce((acc, [key, values]) => {
                  acc[key] = values
                  return acc
                }, {} as TagTreeType)
                setTagTree(newtagtree)
              }}
            >
              <TagList className="flex flex-col items-start gap-4 md:flex-row" items={
                [{ id: String(key), label: String(key) }] satisfies TagItem[]
              }>
                {(item: TagItem) => <Tag count={value.length} {...item}>{item.label}</Tag>}
              </TagList>
            </TagGroup>
            {/* value部分 */}
            <TagGroup label={String(key) + " Tags"} size="md"
              onRemove={(valueKeys: Set<Key>) => {
                const newTags = value.filter((tag) => !valueKeys.has(tag))
                const newtagtree = { ...tagTree, [key]: newTags }
                setTagTree(newtagtree)
              }}
            >
              <TagList className="flex flex-col items-start gap-1" items={value.map((tag) => ({ id: tag, label: tag })) satisfies TagItem[]}>
                {(item: TagItem) => <Tag dot={true} {...item}>{item.label}</Tag>}
              </TagList>
            </TagGroup>
          </div>
        ))}
      </div>
      <footer className="flex justify-end mt-4">
        <ButtonGroup>
          {[
            {
              label: "Confirm",
              onClick: () => {
                close()
                setTags(tagTree)
              },
              icon: CheckCircle,
            },
          ]?.map((action) => (
            <ButtonGroupItem
              key={action.label}
              iconLeading={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
      </footer>
    </div>
  )
}


interface ArticleMetaEditPanelProps extends ArticleMetaPanelProps {
  close: () => void
  setIsDirty: (isDirty: boolean) => void
}

export function ArticleMetaEditPanel({ article, isDirty, setIsDirty, close }: ArticleMetaEditPanelProps) {
  const [started, setStarted] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { userFirebase } = useFirebase()
  const handlePublish = async () => {
    if (!userFirebase?.uid) return
    setStarted(true)
    setIsPublishing(true)
    try {
      const json = article.content as JSONContent
      if (article.aid) {
        await api.article.update(article.aid, article.title, JSON.stringify(json), JSON.stringify(article.tags))
      } else {
        await api.article.create(userFirebase?.uid, article.title, JSON.stringify(json), JSON.stringify(article.tags))
      }
      console.log('文章发布成功')
    } catch (error) {
      console.error('发布文章失败:', error)
      throw error
    } finally {
      setIsPublishing(false)
    }
  }
  return (
    <div className="space-y-4">
      <ArticleMetaPanel article={article} isDirty={isDirty} />
      <div className="flex items-center gap-2">
        status: <p className={`text-sm ${!started ? 'text-gray-500' : isPublishing ? 'text-yellow-500' : 'text-green-500'}`} >
          {!started ? 'Ready' : isPublishing ? 'Publishing...' : 'Published'}
        </p>
      </div>
      <footer className="flex justify-end mt-4">
        <ButtonGroup>
          {[
            {
              label: "Publish",
              onClick: async () => {
                try {
                  await handlePublish()
                } catch (error) {
                  console.error('发布文章失败:', error)
                  throw error
                } finally {
                  setIsDirty(false)
                  close?.()
                }
              },
              icon: CheckCircle,
            },
          ]?.map((action) => (
            <ButtonGroupItem
              key={action.label}
              iconLeading={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
      </footer>
    </div>
  )
}