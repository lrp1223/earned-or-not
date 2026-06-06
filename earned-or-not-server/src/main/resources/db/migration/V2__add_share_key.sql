ALTER TABLE users ADD COLUMN share_key VARCHAR(64) DEFAULT NULL COMMENT '身份凭证（替代JWT）';
CREATE UNIQUE INDEX uk_share_key ON users(share_key);
