import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, type Article } from '@/hooks/use-backend';
import { useFirebase, type UserMetaInfo } from '@/hooks/use-firebase';
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group';
import { Button } from '@/components/base/buttons/button';
import { ArrowLeft, Edit03 } from '@untitledui/icons';
import { useEditorLifetime } from '@/hooks/use-editor-lifetime';
import { EditorContent } from '@tiptap/react';

export default function Article() {
    const { aid } = useParams<{ aid: string }>();
    const navigate = useNavigate();
    const { getArticle } = useApi();
    const { getUserMetaInfo } = useFirebase();
    const { editor, loading: editorLoading } = useEditorLifetime(false);

    const [author, setAuthor] = useState<UserMetaInfo | null>(null);
    const [article, setArticle] = useState<Article | null>(null);
    const [LAE, setLAE] = useState<{ loading: boolean, error: string | null }>({ loading: true, error: null });
    const { user } = useFirebase();

    // 第一个 useEffect: 加载文章内容和用户信息
    useEffect(() => {
        setLAE({ loading: true, error: null });
        const loadArticleData = async () => {
            if (!aid) {
                setLAE({ loading: false, error: '文章 ID 无效' });
                return;
            }
            setLAE({ loading: true, error: null });
            console.log('Article: 开始加载文章数据', aid);

            const result = await getArticle(aid);
            if (result.error) {
                console.error('Article: 加载文章失败', result.error);
                setLAE({ loading: false, error: result.error });
                return;
            }

            if (result.data) {
                console.log('Article: 文章数据加载成功', result.data);
                const userInfo = await getUserMetaInfo(result.data.uid);
                setAuthor(userInfo);
                setArticle(result.data);
                console.log('Article: 文章数据和用户信息加载完成');
                setLAE({ loading: false, error: null });
            } else {
                setLAE({ loading: false, error: '文章不存在' });
            }
        };
        loadArticleData();
    }, [aid, getArticle, getUserMetaInfo]);

    // 第二个 useEffect: 监控加载状态，当文章数据和编辑器都准备好时渲染内容
    useEffect(() => {
        console.log('Editor: 监控加载状态', LAE.loading, editorLoading, editor, article);
        if (!LAE.loading && !editorLoading && editor && article) {
            console.log('Article: 开始渲染编辑器内容');
            try {
                const content = JSON.parse(article.content);
                editor.commands.setContent(content);
                console.log('Article: 编辑器内容渲染完成');
            } catch (err) {
                console.error('Article: 解析文章内容失败', err);
                editor.commands.setContent('');
            }
        }
    }, [LAE.loading, editorLoading, editor, article]);

    const handleBack = () => {
        navigate(-1);
    };

    if (LAE.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"></div>
                    <p>加载中...</p>
                </div>
            </div>
        );
    }

    if (LAE.error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                        {LAE.error || '文章不存在'}
                    </h3>
                    <div className="space-x-4">
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 rounded"
                        >
                            返回
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded"
                        >
                            重试
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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