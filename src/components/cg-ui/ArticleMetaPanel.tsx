import { Tag, TagGroup, type TagItem } from "../base/tags/tags"
import { TagList } from "../base/tags/tags"
import { ArticleClass } from "@/lib/article-class"

interface ArticleMetaPanelProps {
    title?: string
    aid?: string
    tags?: Record<string, string[]>
    poster?: string
    contentLength?: number
}

export function ArticleMetaPanel({ title, aid, tags, poster, contentLength }: ArticleMetaPanelProps) {
    return (
        <div className="flex items-start gap-2 flex-col text-xs">
            <p>文章标题: <span className="text-gray-500">{title}</span></p>
            <p>文章ID: <span className="text-gray-500">{aid}</span></p>
            {tags && Object.entries(tags).map(([key, value]) => (
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
            <p>封面: {poster ? <img src={poster} alt="poster" className="h-20 w-auto object-cover" /> : <span className="text-yellow-500">null</span>}</p>
            <p>content-length: <span className="text-gray-500">{contentLength}</span></p>
        </div>
    )
}