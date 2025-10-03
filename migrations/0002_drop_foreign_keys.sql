-- 删除外键约束
-- 由于 SQLite 不支持直接删除外键约束，需要重建表

-- 1. 创建新的 articles 表（不包含外键约束）
CREATE TABLE articles_new (
    aid TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. 复制数据到新表
INSERT INTO articles_new SELECT * FROM articles;

-- 3. 删除旧表
DROP TABLE articles;

-- 4. 重命名新表
ALTER TABLE articles_new RENAME TO articles;

-- 5. 重新创建索引
CREATE INDEX IF NOT EXISTS idx_articles_uid ON articles(uid);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(updated_at);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
