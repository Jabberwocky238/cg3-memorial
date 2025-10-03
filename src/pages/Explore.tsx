import { useEffect, useState } from 'react';
import { useApi, type Article } from '@/hooks/use-backend';
import { useFirebase } from '@/hooks/use-firebase';
import { useNavigate } from 'react-router-dom';

interface ArticleWithUser extends Article {
  userInfo?: {
    displayName: string;
    email: string;
    photoURL: string;
  };
}

export default function Explore() {
  const { getUserMetaInfo } = useFirebase();
  const [articles, setArticles] = useState<ArticleWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { listArticles } = useApi();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        const result = await listArticles();

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.data) {
          // 为每篇文章获取用户信息
          const articlesWithUser = await Promise.all(
            result.data.map(async (article: Article) => {
              try {
                const userInfo = await getUserMetaInfo(article.uid);
                return {
                  ...article,
                  userInfo: userInfo || undefined,
                };
              } catch (err) {
                console.error('获取用户信息失败:', err);
                return article;
              }
            })
          );

          setArticles(articlesWithUser);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [getUserMetaInfo]);

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
          <p className="mb-4">加载失败: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="mb-4 flex items-center justify-start gap-4">
          <h1 className="text-3xl font-bold mb-2">探索文章</h1>
          <p>发现社区中的精彩内容</p>
        </div>

        <div className="space-y-6">
          {articles.map((article) => (
            <ArticleItem key={article.aid} article={article} onClick={() => {
              navigate(`/article/${article.aid}`);
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}


interface ArticleItemProps {
  article: ArticleWithUser | null;
  onClick: () => void;
}

function ArticleItem({ article, onClick }: ArticleItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!article) {
    return null;
  }

  return (
    <article key={article.aid} className="rounded-lg shadow-sm border border-gray-200 p-6 
        hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {article.userInfo?.photoURL ? (
            <img
              src={article.userInfo.photoURL}
              alt={article.userInfo.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <span className="font-medium">
                {article.userInfo?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium">
              {article.userInfo?.displayName || '匿名用户'}
            </h3>
            <p className="text-sm">
              {formatDate(article.created_at)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3 line-clamp-2">
        {article.title}
      </h2>

      <div className="mb-4 line-clamp-3">
        {article.content}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>文章 ID: {article.aid}</span>
        <span>更新于: {formatDate(article.updated_at)}</span>
      </div>
    </article>
  )
}