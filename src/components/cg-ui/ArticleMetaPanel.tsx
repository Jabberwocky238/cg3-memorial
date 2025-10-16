import { Tag, TagGroup, type TagItem } from "../base/tags/tags"
import { TagList } from "../base/tags/tags"
import type { ArticleData } from "@/lib/article-class"

export interface ArticleMetaPanelProps {
    article: ArticleData
    isDirty?: boolean
}

export function ArticleMetaPanel({ article, isDirty = false }: ArticleMetaPanelProps) {
    return (
        <div className="flex items-start gap-2 flex-col text-xs">
            {isDirty !== undefined && <p>修改状态: <span className={isDirty ? 'text-yellow-500' : 'text-green-500'}>
                {isDirty ? '未保存' : '已保存'}
            </span></p>}
            <p>文章标题: <span className="text-gray-500">{article.title}</span></p>
            <p>文章ID: <span className="text-gray-500">{article.aid}</span></p>
            {Object.entries(article.tags).map(([key, value]) => (
                <div key={key} className="flex flex-col items-start gap-4 md:flex-row">
                    {/* key部分 */}
                    <TagGroup label={key + " Key"} size="sm" >
                        <TagList className="flex flex-col items-start gap-4 md:flex-row" items={
                            [{ id: String(key), label: String(key) }] satisfies TagItem[]
                        }>
                            {(item: TagItem) => <Tag count={value.length} {...item}>{item.label}</Tag>}
                        </TagList>
                    </TagGroup>
                    {/* value部分 */}
                    <TagGroup label={String(key) + " Tags"} size="sm" >
                        <TagList className="flex flex-col items-start gap-1" items={value.map((tag) => ({ id: tag, label: tag })) satisfies TagItem[]}>
                            {(item: TagItem) => <Tag dot={true} {...item}>{item.label}</Tag>}
                        </TagList>
                    </TagGroup>
                </div>
            ))}
            <p>封面: {article.posterUrl ? <img src={article.posterUrl} alt="poster" /> : <span className="text-yellow-500">null</span>}</p>
            <p>content-length: <span className="text-gray-500">{JSON.stringify(article.content).length}</span></p>
        </div>
    )
}