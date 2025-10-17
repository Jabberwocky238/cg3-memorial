import { useEffect, useState, useRef, type RefObject, useContext, useMemo } from 'react'
import type { Key } from '@react-types/shared'
import { useParams } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
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
import { ArticleMetaPanel } from '@/components/cg-ui/ArticleMetaPanel'
import { ArticleClass, type TagTreeType } from '@/lib/article-class'
import { createContext } from 'react'
import { RPC_call, type ArticleDAO } from '@/lib/api/base'
import { Toggle } from '@/components/base/toggle/toggle'

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
    const response = await RPC_call('GET_ARTICLE', { aid: aid })
    const article = await response.json() as ArticleDAO;
    articleRef.current.lock()
    articleRef.current = ArticleClass.fromDAO(article as ArticleDAO)
    articleRef.current.unlock()
    return { isBelongToUser: article.uid === userFirebase?.uid }
  }

  useEffect(() => {
    if (!editor) return
    if (!articleRef.current) return
    if (articleRef.current.isLocked) return
    editor.commands.setContent(articleRef.current.jsonContent)
  }, [editor, articleRef.current?.isLocked, articleRef.current?.jsonContent])

  useEffect(() => {
    if (!aid) { // 如果文章 ID 为空，则认为创建新文章
      // 清空文章数据
      articleRef.current.lock()
      articleRef.current.aid = ''
      articleRef.current.title = ''
      articleRef.current.tags = {}
      articleRef.current.setContent(editor as Editor)
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
  const [tick, setTick] = useState<number>(0)
  const memoArticle = useMemo(() => {
    const article = {
      title: articleRef.current?.title ?? 'Untitled',
      aid: articleRef.current?.aid ?? undefined,
      tags: articleRef.current?.tags ?? {},
      poster: articleRef.current?.poster ?? undefined,
      contentLength: articleRef.current?.htmlContent.length ?? 0,
    }
    // console.log('Edit: memoArticle', article)
    return article
  }, [tick])

  const updateMeta = (editor: Editor | null) => {
    if (!editor) return
    // 找到第一个type: heading, attr: level: 1, 的text
    const heading = editor.state.doc.content.content.find((node) => {
      const type = node.type
      const attrs = node.attrs
      return type.name === 'heading' && attrs.level === 1
    })
    if (!heading) {
      articleRef.current.title = 'Untitled'
      // console.log('Edit: 未找到标题', articleRef.current.title)
    } else {
      articleRef.current.title = heading?.content.content[0].text ?? 'Untitled'
      // console.log('Edit: 找到标题', articleRef.current.title)
    }

    const poster = editor.state.doc.content.content.find((node) => {
      const type = node.type
      const attrs = node.attrs
      return type.name === 'image' && attrs.src
    })
    if (!poster) {
      articleRef.current.poster = undefined
      // console.log('Edit: 未找到封面', articleRef.current.poster)
    } else {
      articleRef.current.poster = poster.attrs['src']
      // console.log('Edit: 找到封面', articleRef.current.poster)
    }
    setTick(prev => prev + 1)
  }
  // 监听编辑器内容变化，更新标题
  useEffect(() => {
    if (!editor) return
    console.log('Edit: 监听编辑器内容变化')
    const timer = setInterval(() => {
      updateMeta(editor)
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

  return (
    <div className={`h-full w-full p-4 space-y-4 ${className}`}>
      <ArticleMetaPanel {...memoArticle} />

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
            }}
          />}
        </ModalButton>
        <ModalButton
          title="Publish"
          tooltip="Publish"
          iconLeading={CheckCircle}
          color="secondary" size="sm"
        >
          {(close) => <ArticleMetaEditPanel close={close} editor={editor} />}
        </ModalButton>
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


export function ArticleMetaEditPanel({ editor, close }: { editor: Editor | null, close: () => void }) {
  const [started, setStarted] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { userFirebase } = useFirebase()
  const { createTx } = useArweave()
  const { articleRef } = useEditContext()
  const article = articleRef.current
  const [willUploadToArweave, setWillUploadToArweave] = useState<boolean>(false)
  const { theme } = useTheme()

  const handlePublish = async () => {
    if (!userFirebase?.uid) return
    setStarted(true)
    setIsPublishing(true)
    article.lock()
    article.setContent(editor as Editor)
    try {
      let tx_id = ''
      if (JSON.stringify(article.jsonContent).length <= 1000) {
        throw new Error('Edit: 文章内容太短，无法发布')
      }
      if (willUploadToArweave) {
        const template = templateMake(article.htmlContent, article.title, theme === 'dark')
        const { tx, res } = await createTx(template, [
          ['Content-Type', 'text/html'],
          ['Title', article.title],
          ['Type', 'file'],
          ['User-Agent', 'Permane-Inc'],
        ])
        tx_id = tx.id
        const result1 = await RPC_call('REPORT_UPCHAIN_TX', {
          tx_id: tx.id,
          uid: userFirebase?.uid as string,
          content: new Blob([template], { type: 'text/html' }),
          content_type: 'text/html',
          headers: JSON.stringify({}),
          msg_type: 'article_update',
        })
        console.log('Report upchain tx success', result1)
      }     
      let articleData = {
        title: article.title,
        tags: JSON.stringify(article.tags),
        content: JSON.stringify(article.jsonContent),
        poster: article.poster ?? '',
        uid: userFirebase?.uid as string,
      }
      if (article.aid) {
        articleData = { ...articleData, ...{ 'aid': article.aid as string } }
      }
      if (willUploadToArweave) {
        articleData = { ...articleData, ...{ 'chain': JSON.stringify({ tx_id: tx_id, chain_type: 'arweave' }) } }
      } else {
        articleData = { ...articleData, ...{ 'chain': '{}' } }
      }
      const result = await RPC_call('UPDATE_ARTICLE', {
        article: JSON.stringify(articleData),
      })
      const { aid } = await result.json()
      article.aid = aid
      console.log('文章发布成功')
    } catch (error) {
      console.error('发布文章失败:', error)
      throw error
    } finally {
      setIsPublishing(false)
      article.unlock()
    }
  }
  return (
    <div className="space-y-4">
      <ArticleMetaPanel
        title={article.title}
        aid={article.aid}
        tags={article.tags}
        poster={article.poster}
        contentLength={article.htmlContent.length}
      />
      <Toggle label="Upload to Arweave ?" hint={willUploadToArweave ? 'will cost some ARs' : 'not Upload'} size="sm" value={willUploadToArweave.toString()} onChange={(e) => setWillUploadToArweave(e)} />
      <div className="flex items-center gap-2">
        status: <p className={`text-sm ${!started ? 'text-gray-500' : isPublishing ? 'text-yellow-500' : 'text-green-500'}`} onClick={handlePublish}  >
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
                  throw error
                } finally {
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