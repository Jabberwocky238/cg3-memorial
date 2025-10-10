import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, type Article } from '@/hooks/use-backend';
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
import { ArticleMeta, ArticleMetaPanel } from '@/components/cg-ui/ArticleMeta';

export default function Article() {
    const { aid } = useParams<{ aid: string }>();
    const navigate = useNavigate();
    const { getArticle } = useApi();
    const { editor } = useEditorLifetime(false);
    const { LOG_append, LOG_clear, setError } = useAppState();
    const [author, setAuthor] = useState<UserInfo | null>(null);
    const [article, setArticle] = useState<Article | null>(null);
    const { userFirebase, getUserFirebase } = useFirebase();

    const loadArticleData = async () => {
        if (!aid) {
            throw new Error('文章 ID 无效');
        }
        const result = await getArticle(aid);
        if (result.error) {
            throw new Error('Article: 加载文章失败' + result.error);
        }
        if (result.data) {
            console.log('Article: 文章数据加载成功', result.data);
            const userInfo = await getUserFirebase(result.data.uid);
            setAuthor(userInfo);
            setArticle(result.data);
        } else {
            throw new Error('文章不存在');
        }
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

    const loadEditorContent = async () => {
        if (!editor || !article) return
        const content = JSON.parse(article.content);
        editor.commands.setContent(content);
    }

    // 第二个 useEffect: 监控加载状态，当文章数据和编辑器都准备好时渲染内容
    useEffect(() => {
        if (editor && article) {
            try {
                LOG_append('Article: 开始渲染编辑器内容');
                loadEditorContent();
            } catch (error) {
                setError('Article: 加载编辑器内容失败' + error);
            } finally {
                LOG_clear();
            }
        }
    }, [article, editor]);

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen">
            <div className="py-8">
                <header className="max-w-4xl mx-auto px-4 flex items-center justify-start space-x-4">
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                        <div className="flex items-center justify-start space-x-4">
                            {/* 返回按钮 */}
                            <Button iconLeading={ArrowLeft} color='tertiary' onClick={handleBack}>
                                返回
                            </Button>
                            <AvatarLabelGroup
                                size="md"
                                src={author?.photoURL}
                                alt={author?.displayName || '未设置'}
                                title={author?.displayName || '未设置'}
                                subtitle={author?.email || '未设置'}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                            <div>
                                <p className="text-sm">
                                    发布于 {formatDate(article?.created_at ?? '')}
                                    {article?.updated_at !== article?.created_at && (
                                        <span className="ml-2">
                                            · 更新于 {formatDate(article?.updated_at ?? '')}
                                        </span>
                                    )}
                                </p>
                                <p className='text-sm truncate md:max-w-[300px] max-w-[200px]'>文章 ID: {article?.aid}</p>
                            </div>
                            {userFirebase && userFirebase?.uid === article?.uid && (
                                <Button iconLeading={Edit03} color='tertiary' onClick={() => navigate(`/edit/${article?.aid}`)}>
                                    编辑
                                </Button>
                            )}
                        </div>
                    </div>
                </header>
                <ControlPanelContainer editor={editor} article={article} />
                {editor && <EditorContent
                    editor={editor}
                    role="presentation"
                    className="simple-editor-content"
                />}
            </div>
        </div>
    );
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

function ArticleArweaveInfo({ pageId }: { pageId?: string }) {
    if (!pageId) return null;

    const { searchByQuery } = useArweave();
    const [arweaveInfo, setArweaveInfo] = useState<any>(null);

    useEffect(() => {
        const loadArweaveInfo = async () => {
            const res = await searchByQuery({ 'Page-Id': pageId });
            console.log('Article: 文章数据和用户信息加载完成', res);
            setArweaveInfo(res);
        };
        loadArweaveInfo();
    }, [searchByQuery]);

    return (
        <div>
            <p>Article Arweave Info</p>
        </div>
    );
}

function ControlPanelContainer(props: ControlPanelProps) {
    const hiddenClassPair = ["lg:hidden", "max-lg:hidden"]
    return (
        <>
            <MobilePortal OpenIcon={ArrowBlockUp} CloseIcon={CloseIcon} hiddenClass={hiddenClassPair[0]}>
                <ControlPanel {...props} />
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
                <ControlPanel {...props} />
            </div>
        </>
    )
}

interface ControlPanelProps {
    editor: Editor | null
    article: Article | null
    className?: string
}

function ControlPanel({ className, editor, article }: ControlPanelProps) {
    const [price, setPrice] = useState("");
    const { transfer } = useCashier();
    const [rewardError, setRewardError] = useState<ReactNode | null>(null);
    const { userFirebase } = useFirebase();
    const articleMeta = article ? ArticleMeta.fromArticle(article) : null;
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

    return (
        <div className={`h-full w-full p-4 space-y-4 bg-primary ${className}`}>

            <ArticleArweaveInfo pageId={article?.aid} />

            {articleMeta && <ArticleMetaPanel article={articleMeta} />}

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


