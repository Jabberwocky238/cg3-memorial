-- 创建 ar_tx_record 表
CREATE TABLE ar_tx_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT NOT NULL,
    uid TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    content_type TEXT,
    headers TEXT,
    content BLOB
);

-- 创建索引以提高查询性能
CREATE INDEX idx_ar_tx_record_tx_id ON ar_tx_record(tx_id);
CREATE INDEX idx_ar_tx_record_uid ON ar_tx_record(uid);
CREATE INDEX idx_ar_tx_record_created_at ON ar_tx_record(created_at);
