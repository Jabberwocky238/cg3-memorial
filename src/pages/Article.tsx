import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, type Article } from '@/hooks/use-backend';
import { useFirebase, type UserMetaInfo } from '@/hooks/use-firebase';
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group';
import { Button } from '@/components/base/buttons/button';
import { ArrowLeft, Edit03 } from '@untitledui/icons';
import { useEditorLifetime } from '@/hooks/use-editor-lifetime';
import { EditorContent } from '@tiptap/react';
import { useAppState } from '@/hooks/use-app-state';

export default function Article() {
    const { aid } = useParams<{ aid: string }>();
    const navigate = useNavigate();
    const { getArticle } = useApi();
    const { editor } = useEditorLifetime(false);
    const { LOG_append, LOG_clear, setError } = useAppState();
    const [author, setAuthor] = useState<UserMetaInfo | null>(null);
    const [article, setArticle] = useState<Article | null>(null);
    const { user, getUserMeta } = useFirebase();

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
            const userInfo = await getUserMeta(result.data.uid);
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
    }, [aid, getArticle, getUserMeta]);

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
                {/* 文章头部 */}
                <header className="max-w-4xl mx-auto px-4 flex items-center justify-start space-x-4">
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
                    <div>
                        <p className="text-sm">
                            发布于 {formatDate(article?.created_at ?? '')}
                            {article?.updated_at !== article?.created_at && (
                                <span className="ml-2">
                                    · 更新于 {formatDate(article?.updated_at ?? '')}
                                </span>
                            )}
                        </p>
                        <p className='text-sm'>文章 ID: {article?.aid}</p>
                    </div>
                    {user && user?.uid === article?.uid && (
                        <Button iconLeading={Edit03} color='tertiary' onClick={() => navigate(`/edit/${article?.aid}`)}>
                            编辑
                        </Button>
                    )}
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