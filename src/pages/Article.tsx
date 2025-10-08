import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, type Article } from '@/hooks/use-backend';
import { useFirebase } from '@/hooks/use-firebase';
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group';
import { Button } from '@/components/base/buttons/button';
import { ButtonGroup, ButtonGroupItem } from '@/components/base/button-group/button-group';
import { ArrowLeft, Coins01, Edit03 } from '@untitledui/icons';
import { useEditorLifetime } from '@/hooks/use-editor-lifetime';
import { EditorContent } from '@tiptap/react';
import { useAppState } from '@/hooks/use-app-state';
import type { UserInfo } from 'firebase/auth';
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover, Input, Link } from "react-aria-components";
import { cx } from '@/utils/cx';
import { Label } from '@/components/base/input/label';
import { useCashier } from '@/hooks/use-cashier';

export default function Article() {
    const { aid } = useParams<{ aid: string }>();
    const navigate = useNavigate();
    const { getArticle } = useApi();
    const { editor } = useEditorLifetime(false);
    const { LOG_append, LOG_clear, setError } = useAppState();
    const [author, setAuthor] = useState<UserInfo | null>(null);
    const [article, setArticle] = useState<Article | null>(null);
    const { userFirebase, getUserFirebase } = useFirebase();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { transfer } = useCashier();

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
            console.log('Article: 文章数据和用户信息加载完成');
        } else {
            throw new Error('文章不存在');
        }
    };

    // 第一个 useEffect: 加载文章内容和用户信息
    useEffect(() => {
        LOG_append('Article: 开始加载文章数据' + aid);
        try {
            loadArticleData();
        } catch (error) {
            setError('Article: 加载文章数据失败' + error);
        } finally {
            LOG_clear();
        }
    }, [aid, getArticle, getUserFirebase]);

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

    const handleReward = async () => {
        if (!article) {
            alert('文章不存在');
            return;
        }
        await transfer(price, article.uid);
        console.log('打赏成功');
    }

    const [price, setPrice] = useState(0);

    return (
        <div className="min-h-screen">
            <div className="py-8">
                {/* 文章头部 */}
                <ButtonGroup className="w-full mx-auto px-4 justify-center">
                    <ButtonGroupItem iconLeading={ArrowLeft} onClick={handleBack}>
                        返回
                    </ButtonGroupItem>
                    <AriaDialogTrigger>
                        <AriaButton
                            ref={triggerRef}
                            className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover"
                        >
                        <Coins01 className="size-4 shrink-0" />
                        </AriaButton>
                        <AriaPopover
                            placement="bottom right"
                            triggerRef={triggerRef}
                            offset={8}
                            className={({ isEntering, isExiting }) =>
                                cx(
                                    "origin-(--trigger-anchor-point) will-change-transform",
                                    isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                    isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                                )
                            }
                        >
                            <div className="w-64 rounded-xl bg-white p-4 shadow-lg flex flex-col gap-2">
                                <Label>打赏金额</Label>
                                <Input
                                    placeholder="请输入打赏金额"
                                    value={price}
                                    onChange={(e) => {
                                        try {
                                            setPrice(parseFloat(e.target.value));
                                        } catch (error) {
                                            alert('打赏金额不是数字');
                                        }
                                    }}
                                />
                                <Button onClick={handleReward}>打赏</Button>
                            </div>
                        </AriaPopover>
                    </AriaDialogTrigger>
                </ButtonGroup>
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