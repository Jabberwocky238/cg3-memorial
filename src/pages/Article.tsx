import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, type Article } from '@/hooks/use-backend';
import { useFirebase, type UserMetaInfo } from '@/hooks/use-firebase';
import { createSimpleEditor, SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import type { User } from '@firebase/auth';

export default function Article() {
    const { aid } = useParams<{ aid: string }>();
    const navigate = useNavigate();
    const { getArticle } = useApi();
    const { getUserMetaInfo } = useFirebase();
    const editor = createSimpleEditor(false);
    const [author, setAuthor] = useState<UserMetaInfo | null>(null);
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadArticle = async () => {
            if (!aid) {
                setError('文章 ID 无效');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const result = await getArticle(aid);

                if (result.error) {
                    setError(result.error);
                    return;
                }

                if (result.data) {
                    // 获取用户信息
                    try {
                        const userInfo = await getUserMetaInfo(result.data.uid);
                        console.log('userInfo', userInfo);
                        setAuthor(userInfo);
                        setArticle(result.data);
                        editor?.commands.setContent(result.data.content);
                    } catch (err) {
                        console.error('获取用户信息失败:', err);
                        setAuthor(null);
                        setArticle(null);
                    }
                } else {
                    setError('文章不存在');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载失败');
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [aid, getUserMetaInfo]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"></div>
                    <p>加载中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                        {error || '文章不存在'}
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
                <header className="max-w-4xl mx-auto px-4 flex items-center justify-start">
                    {/* 返回按钮 */}
                    <button
                        onClick={handleBack}
                        className="flex items-center transition-colors px-4 "
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        返回
                    </button>
                    <div className="flex items-center space-x-4">
                        {author?.photoURL ? (
                            <img
                                src={author.photoURL}
                                alt={author.displayName}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center">
                                <span className="font-medium text-lg">
                                    {author?.displayName?.charAt(0) || 'U'}
                                </span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-medium">
                                {author?.displayName || '匿名用户'}
                            </h2>
                            <p className="text-sm">
                                发布于 {formatDate(article?.created_at ?? '')}
                                {article?.updated_at !== article?.created_at && (
                                    <span className="ml-2">
                                        · 更新于 {formatDate(article?.updated_at ?? '')}
                                    </span>
                                )}
                            </p>
                            <p>文章 ID: {article?.aid}</p>
                        </div>
                    </div>
                </header>

                {editor && <SimpleEditor editor={editor} modifiable={false} />}
            </div>
        </div>
    );
}