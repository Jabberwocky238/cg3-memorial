-- 创建 topics 表
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    aid TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aid) REFERENCES articles(aid) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX idx_topics_topic ON topics(topic);
CREATE INDEX idx_topics_aid ON topics(aid);
CREATE INDEX idx_topics_created_at ON topics(created_at);
CREATE INDEX idx_topics_updated_at ON topics(updated_at);

-- 创建复合索引用于常见查询
CREATE INDEX idx_topics_topic_aid ON topics(topic, aid);
