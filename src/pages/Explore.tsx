import { useEffect } from 'react';
import { RPC_call, type ArticleDAO } from '@/lib/api/base';
import { useFirebase } from '@/hooks/use-firebase';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { UserInfo } from 'firebase/auth';
import { TabNavigation, TabNavigationLink } from "@/components/tremor/TabNavigation"
import { formatDate } from '@/utils/cg-utils';
import { uniqBy } from 'lodash-es';
import { LoadingPage, useLoading } from '@/hooks/use-loading';

type ArticleWithUser = ArticleDAO & { userInfo?: UserInfo }

export default function Explore() {
  const { getUserFirebase } = useFirebase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // 查询参数
  const topic = searchParams.get('topic'); // 获取 topic 查询参数

  const loadArticles = async () => {
    const result = await RPC_call('RANK_TOPICS_TOPK', { topic: topic ? topic : '', top_k: '10' });
    if (result.ok) {
      const data = await result.json() as ArticleDAO[];
      // 为每篇文章获取用户信息
      const articlesWithUser = await Promise.all(
        uniqBy(data, 'aid').map(async (article: ArticleDAO) => {
          try {
            const userInfo = await getUserFirebase(article.uid);
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
      return articlesWithUser;
    } else {
      throw new EasyError('获取文章失败');
    }
  };

  const { start: startLoadArticles, loading, result: articles } = useLoading({
    asyncfn: loadArticles,
    label: 'Loading articles...'
  });

  useEffect(() => {
    startLoadArticles();
  }, []);

  return (
    <div className="p-6 h-full overflow-y-hidden">
      <div className="max-lg:w-full lg:max-w-6xl h-full mx-auto flex flex-col lg:flex-row gap-4 justify-center">
        {/* 左侧内容 - 移动端全宽，桌面端占2/3 */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4 h-full overflow-y-auto">
          <TabNavigation>
            <TabNavigationLink href="/explore">Home</TabNavigationLink>
            <TabNavigationLink href="/explore?topic=news">News</TabNavigationLink>
            <TabNavigationLink href="/explore?topic=technology">Technology</TabNavigationLink>
            <TabNavigationLink href="/explore?topic=warfare">Warfare</TabNavigationLink>
          </TabNavigation>

          {loading ? (
            <LoadingPage label="Loading articles..." />
          ) : (
            <>
              <CarouselMd className='mb-4' articles={articles.slice(0, 5)} />
              {articles.map((article) => (
                <ArticleItem key={article.aid} article={article} onClick={() => {
                  navigate(`/article/${article.aid}`);
                }} />
              ))}
            </>
          )}
        </div>

        {/* 右侧排行榜 - 移动端全宽，桌面端占1/3 */}
        <div className="w-full lg:w-1/3 h-full overflow-y-auto space-y-6">
          <h4 className='text-lg font-bold'>Recent Articles</h4>
          {loading ? (
            <LoadingPage label="Loading Rankings..." />
          ) : (
            <div className='space-y-2'>
              {articles.map((article, index) => (
                <div key={article.aid} className='flex items-center gap-2 hover:text-primary bg-primary_hover rounded-md p-2'>
                  <span>{index + 1}.</span>
                  <Link to={`/article/${article.aid}`}>{article.title}</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { EasyError } from '@/hooks/use-error';

const PLACEHOLDER_IMAGES = [
  'https://www.untitledui.com/application/plants.webp',
  'https://images.unsplash.com/photo-1484506097116-1bcba4fa7568?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?q=80&w=2971&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
]

interface CarouselMdProps {
  articles: ArticleWithUser[];
  className?: string;
  radio?: string;
}

const CarouselMd = ({ radio = "24/9", className, articles }: CarouselMdProps) => {
  const navigate = useNavigate();
  return (
    <Carousel.Root className={`relative aspect-[${radio}] w-full h-auto max-h-96 ${className}`} opts={{ loop: true }}>
      <Carousel.PrevTrigger className="absolute top-1/2 left-4 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-alpha-white/90 p-2 text-fg-secondary outline-focus-ring backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-fg-disabled">
        <ChevronLeft className="size-5" />
      </Carousel.PrevTrigger>
      <Carousel.NextTrigger className="absolute top-1/2 right-4 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-alpha-white/90 p-2 text-fg-secondary outline-focus-ring backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-fg-disabled">
        <ChevronRight className="size-5" />
      </Carousel.NextTrigger>

      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <Carousel.IndicatorGroup className="flex gap-2 justify-center bg-black p-2 rounded-full">
          {articles.map((article, index) => (
            <Carousel.Indicator index={index} key={article.aid}><div className="bg-white rounded-full w-2 h-2"></div></Carousel.Indicator>
          ))}
          {/* <Carousel.Indicator index={0} ><div className="bg-white rounded-full w-2 h-2"></div></Carousel.Indicator>
          <Carousel.Indicator index={1} ><div className="bg-white rounded-full w-2 h-2"></div></Carousel.Indicator>
          <Carousel.Indicator index={2} ><div className="bg-white rounded-full w-2 h-2"></div></Carousel.Indicator> */}
        </Carousel.IndicatorGroup>
      </div>

      <Carousel.Content className="gap-2">
        {articles.map((article, index) => (
          <Carousel.Item key={article.aid} className="overflow-hidden rounded-xl relative cursor-pointer"
            onClick={() => {
              navigate(`/article/${article.aid}`);
            }}
          >
            <img alt="Image by Unsplash"
              src={article.poster ? article.poster : PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}
              className="size-full object-cover"
            />
            <div
              style={{ boxSizing: 'border-box' }}
              className="p-4 absolute bottom-0 left-0 right-0 text-white backdrop-blur-sm rounded-lg">
              <h2 className="text-xl font-semibold mb-3 line-clamp-2">{article.title}</h2>
              <pre className="text-sm truncate">tags:{article.tags}</pre>
              <p className="text-sm">
                {formatDate(article.created_at)}
              </p>
            </div>
          </Carousel.Item>
        ))}
        {/* <Carousel.Item className="overflow-hidden rounded-xl">
          <img alt="Image by Unsplash" src="https://www.untitledui.com/application/plants.webp" className="size-full object-cover" />
        </Carousel.Item>
        <Carousel.Item className="overflow-hidden rounded-xl">
          <img
            alt="Image by Unsplash"
            src="https://images.unsplash.com/photo-1484506097116-1bcba4fa7568?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="size-full object-cover"
          />
        </Carousel.Item>
        <Carousel.Item className="overflow-hidden rounded-xl">
          <img
            alt="Image by Unsplash"
            src="https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?q=80&w=2971&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="size-full object-cover"
          />
        </Carousel.Item> */}
      </Carousel.Content>
    </Carousel.Root>
  );
};


interface ArticleItemProps {
  article: ArticleWithUser | null;
  onClick: () => void;
}

function ArticleItem({ article, onClick }: ArticleItemProps) {

  if (!article) {
    return null;
  }

  return (
    <article key={article.aid}
      className="rounded-lg shadow-sm border border-gray-200 p-6 
        hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {article.userInfo?.photoURL ? (
            <img
              src={article.userInfo.photoURL}
              alt={article.userInfo.displayName!}
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

      <div className="mb-4 line-clamp-3 flex items-center gap-2">
        {article.poster ? (
          <>
            <img
              src={article.poster}
              alt="文章封面"
              className="object-cover h-[100px] max-lg:h-[50px]"
            />
            <div className="flex-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-3 line-clamp-2">
                {article.title}
              </h2>
              <pre className="text-sm truncate">tags:{article.tags}</pre>
            </div>
          </>
        ) : (<div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold mb-3 line-clamp-2">
            {article.title}
          </h2>
          <pre className="text-sm truncate">tags:{article.tags}</pre>
        </div>)}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>文章 ID: {article.aid}</span>
        <span>更新于: {formatDate(article.updated_at)}</span>
      </div>
    </article>
  )
}