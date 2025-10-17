-- 删除老的 article 表
DROP TABLE IF EXISTS articles;

-- 创建新的 articles 表
CREATE TABLE articles (
    aid TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT NOT NULL,
    poster TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chain TEXT,
    tags TEXT
);

-- 创建索引以提高查询性能
CREATE INDEX idx_articles_uid ON articles(uid);
CREATE INDEX idx_articles_created_at ON articles(created_at);
CREATE INDEX idx_articles_updated_at ON articles(updated_at);
CREATE INDEX idx_articles_title ON articles(title);
CREATE INDEX idx_articles_chain ON articles(chain);
CREATE INDEX idx_articles_tags ON articles(tags);
