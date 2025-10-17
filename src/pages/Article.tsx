import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RPC_call, type ArticleDAO } from '@/lib/api/base';
import { useFirebase } from '@/hooks/use-firebase';
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group';
import { Button } from '@/components/base/buttons/button';
import { Archive, ArrowBlockUp, ArrowLeft, Coins01, Edit03 } from '@untitledui/icons';
import { useEditorLifetime } from '@/hooks/use-editor-lifetime';
import { Editor, EditorContent } from '@tiptap/react';
import { isUUID, useAppState, useGlobalPortal } from '@/hooks/use-app-state';
import type { UserInfo } from 'firebase/auth';
import { Input } from "react-aria-components";
import { Label } from '@/components/base/input/label';
import { ErrorCashier, useCashier } from '@/hooks/use-cashier';
import { useArweave } from '@/hooks/use-arweave';
import { MobilePortal, ModalButton } from '@/components/application/app-navigation/base-components/mobile-header';
import { CloseIcon } from '@/components/tiptap-icons/close-icon';
import { ArticleMetaPanel } from '@/components/cg-ui/ArticleMetaPanel';
import { ArticleClass } from '@/lib/article-class';
import { formatDate } from '@/utils/cg-utils';
import type Transaction from 'arweave/web/lib/transaction';

const ArticleContext = createContext<{
    article: ArticleDAO
    author?: UserInfo
} | null>(null);

export function useArticlContext() {
    const context = useContext(ArticleContext);
    if (!context) {
        throw new Error('useArticlContext must be used within a ArticleContext');
    }
    return context;
}

export default function Article() {
    const { aid } = useParams<{ aid: string }>();
    const { editor } = useEditorLifetime(false);
    const { LOG_append, LOG_clear, setError } = useAppState();
    const [author, setAuthor] = useState<UserInfo | null>(null);
    const [article, setArticle] = useState<ArticleDAO | null>(null);
    const { userFirebase, getUserFirebase } = useFirebase();

    const loadArticleData = async () => {
        if (!aid) {
            throw new Error('文章 ID 无效');
        }
        const result = await RPC_call('GET_ARTICLE', { aid: aid });
        let article = await result.json() as ArticleDAO;
        console.log('Article: 文章数据加载成功', article);
        setArticle(article);
        const userInfo = await getUserFirebase(article.uid);
        setAuthor(userInfo as UserInfo);
    };

    // 第一个 useEffect: 加载文章内容和用户信息
    useEffect(() => {
        if (!aid || !isUUID(aid)) {
            setError('Article: 文章 ID 无效');
            return;
        }
        LOG_append('Article: 开始加载文章数据' + aid);
        try {
            loadArticleData();
        } catch (error) {
            setError('Article: 加载文章数据失败' + error);
        } finally {
            LOG_clear();
        }
    }, [aid]);

    // 第二个 useEffect: 监控加载状态，当文章数据和编辑器都准备好时渲染内容
    useEffect(() => {
        if (editor && article) {
            try {
                LOG_append('Article: 开始渲染编辑器内容');
                if (!editor || !article) return
                editor.commands.setContent(JSON.parse(article.content));
            } catch (error) {
                setError('Article: 加载编辑器内容失败' + error);
            } finally {
                LOG_clear();
            }
        }
    }, [article, editor]);

    if (!article || !author) {
        return null;
    }

    return (
        <ArticleContext.Provider value={{ article, author }}>
            <div className="h-full flex flex-col">
                <div className="flex-1 flex gap-4 overflow-hidden justify-center">
                    <div className="lg:w-5/8 max-lg:w-full overflow-auto dark:bg-blue-800 bg-blue-100 border border-secondary rounded-lg">
                        {editor && <EditorContent
                            editor={editor}
                            role="presentation"
                            className="simple-editor-content"
                        />}
                    </div>
                    <ControlPanelContainer
                        className="lg:w-2/8 max-lg:hidden overflow-auto dark:bg-red-800 bg-red-100 border border-secondary rounded-lg"
                        editor={editor}
                    />
                </div>
            </div>
        </ArticleContext.Provider>
    );
}



function ArticleArweaveInfo({ article }: { article: ArticleDAO }) {
    if (!article) return null;
    const { searchTx } = useArweave();
    const [arweaveInfo, setArweaveInfo] = useState<Transaction | null>(null);

    useEffect(() => {
        const loadArweaveInfo = async () => {
            const chainInfo = JSON.parse(article.chain) as Record<string, string>;
            const res = await searchTx(chainInfo.tx_id);
            console.log('Article: ArticleArweaveInfo', res);
            setArweaveInfo(res as Transaction);
        };
        loadArweaveInfo();
    }, [article.chain]);

    return (
        <div className="text-xs">
            <p >Arweave Transaction Info</p>
            <div>   
                <p className="text-sm w-full rounded break-words whitespace-pre-wrap">Tx ID: {arweaveInfo?.id}</p>
                <div>
                    {arweaveInfo?.tags.map((tag) => (
                        <p key={tag.name}>{tag.name}: {tag.value}</p>
                    ))}
                </div>
            </div>
            {/* <pre className="p-4 rounded break-words whitespace-pre-wrap overflow-auto">
                {JSON.stringify(arweaveInfo, null, 2)}
            </pre> */}
        </div>
    );
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
                transform
                z-30 overflow-hidden 
                ${hiddenClassPair[1]} ${className}`}
            >
                <ControlPanel {...rest} />
            </div>
        </>
    )
}

interface ControlPanelProps {
    editor: Editor | null
    className?: string
}

function ControlPanel({ className, editor }: ControlPanelProps) {
    const { article, author } = useArticlContext();
    const [price, setPrice] = useState("");
    const { transfer } = useCashier();
    const [rewardError, setRewardError] = useState<ReactNode | null>(null);
    const { userFirebase } = useFirebase();
    const articleMeta = article ? ArticleClass.fromDAO(article) : null;
    const navigate = useNavigate();

    const handleReward = async () => {
        if (!article) {
            alert('文章不存在');
            return;
        }
        try {
            if (price === "") {
                setRewardError("请输入打赏金额");
                return;
            }
            const priceFloat = parseFloat(price);
            console.log("priceFloat", priceFloat);
            if (isNaN(priceFloat)) {
                setRewardError("打赏金额无效 NaN");
                return;
            }
            await transfer(priceFloat, article.uid);
            setRewardError(null);
            setPrice("");
        } catch (error) {
            switch (error) {
                case ErrorCashier.UserCashierNotFound:
                    setRewardError("用户账户不存在");
                    break;
                case ErrorCashier.InvalidAmount:
                    setRewardError("打赏金额无效");
                    break;
                case ErrorCashier.InsufficientBalance:
                    setRewardError(<>余额不足 <Button color="secondary" size="sm" onClick={() => navigate('/profile#cashier')}>前往充值</Button></>);
                    break;
                case ErrorCashier.TransferFailed:
                    setRewardError("打赏失败");
                    break;
                case ErrorCashier.SelfTransfer:
                    setRewardError("不能打赏给自己");
                    break;
                default:
                    setRewardError(`打赏失败: ${error}`);
                    break;
            }
        }
    }
    // 处理日志HTML
    const handleLogHTML = () => {
        console.log(editor?.getHTML())
    }

    const isEditable = userFirebase?.uid === article?.uid
    const handleEdit = () => {
        navigate(`/edit/${article?.aid}`)
    }

    return (
        <div className={`h-full w-full p-4 space-y-4 ${className} overflow-auto`}>
            <ArticleArweaveInfo article={article} />
            <AvatarLabelGroup
                size="md"
                src={author?.photoURL}
                alt={author?.displayName || '未设置'}
                title={author?.displayName || '未设置'}
                subtitle={author?.email || '未设置'}
            />
            <p className="text-sm">
                发布于 {formatDate(article?.created_at ?? '')}
                {article?.updated_at !== article?.created_at && (
                    <span className="ml-2">
                        · 更新于 {formatDate(article?.updated_at ?? '')}
                    </span>
                )}
            </p>
            {articleMeta && <ArticleMetaPanel {...articleMeta} />}

            <div className="grid max-lg:grid-cols-2 lg:grid-cols-1 gap-2 ">
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
                <Button
                    isLoading={false} showTextWhileLoading iconLeading={Archive}
                    color="secondary" size="sm" onClick={handleLogHTML}
                >
                    Log HTML D
                </Button>
                <Button
                    isLoading={false} showTextWhileLoading iconLeading={Edit03}
                    disabled={!isEditable} className={isEditable ? "" : "opacity-50 cursor-not-allowed pointer-events-none"}
                    color="secondary" size="sm" onClick={handleEdit}
                >
                    Edit
                </Button>
                {userFirebase && userFirebase?.uid !== article?.uid && <ModalButton
                    title="Reward"
                    tooltip="Reward"
                    iconLeading={Coins01}
                    color="secondary" size="sm"
                    // onClick={handleReward}
                    // forceRefresh
                    actions={[
                        {
                            label: "Reward",
                            onClick: (close) => { handleReward() },
                            icon: Coins01,
                        },
                    ]}
                >
                    <Label className='text-sm'>打赏金额</Label>
                    <Input
                        type="text"
                        className="p-4 text-sm w-full"
                        placeholder="请输入打赏金额"
                        value={price}
                        onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPrice(e.target.value);
                        }}
                    />
                    {rewardError && <p className='text-sm text-error'>{rewardError}</p>}
                </ModalButton>}
            </div>
        </div>
    )
}


