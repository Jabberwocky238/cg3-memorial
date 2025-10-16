import type { ArticleDAO } from "@/lib/api"
import type { Editor, JSONContent } from "@tiptap/react"

export type TagTreeType = Record<string, string[]>

export class Mutex {
    private __mutex: boolean = false
    get isLocked() {
        return this.__mutex
    }
    lock() {
        this.__mutex = true
    }
    unlock() {
        this.__mutex = false
    }
}

export interface ArticleData {
    aid?: string
    title: string
    tags: TagTreeType
    posterUrl?: string
    content: JSONContent
}

export class ArticleClass extends Mutex implements ArticleData {

    constructor(
        public aid?: string,
        public title: string = 'Untitled',
        public tags: TagTreeType = {},
        public posterUrl?: string,
        public content: JSONContent = {},
    ) {
        super()
    }

    static fromInterface(article: ArticleData): ArticleClass {
        const articleClass = new ArticleClass()
        articleClass.aid = article.aid
        articleClass.title = article.title
        articleClass.tags = article.tags
        articleClass.posterUrl = article.posterUrl
        articleClass.content = article.content
        return articleClass
    }

    static fromDAO(article: ArticleDAO): ArticleClass {
        const articleClass = new ArticleClass()
        articleClass.aid = article.aid
        articleClass.title = article.title
        articleClass.tags = JSON.parse(article.tags) as TagTreeType
        articleClass.content = JSON.parse(article.content) as JSONContent
        return articleClass
    }

}
