import type { ArticleDAO } from "@/lib/api/base"
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

export interface ArticleClassProps {
    aid?: string
    title: string
    tags: TagTreeType
    poster?: string
    jsonContent: JSONContent
    htmlContent: string
}

export class ArticleClass extends Mutex {
    private _jsonContent: JSONContent = {}
    private _htmlContent: string = ''

    constructor(
        public aid?: string,
        public title: string = 'Untitled',
        public tags: TagTreeType = {},
        public poster?: string,
    ) {
        super()
    }

    setContent(editor: Editor) {
        if (!editor) return
        this._jsonContent = editor.getJSON()
        this._htmlContent = editor.getHTML()
    }

    get htmlContent(): string {
        return this._htmlContent
    }

    get jsonContent(): JSONContent {
        return this._jsonContent
    }

    static fromDAO(article: ArticleDAO): ArticleClass {
        const articleClass = new ArticleClass()
        articleClass.aid = article.aid
        articleClass.title = article.title
        articleClass.tags = JSON.parse(article.tags) as TagTreeType
        articleClass._jsonContent = JSON.parse(article.content) as JSONContent
        articleClass.poster = article.poster
        return articleClass
    }

}
