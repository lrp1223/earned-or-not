ALTER TABLE users ADD COLUMN avatar_base64 MEDIUMTEXT DEFAULT NULL COMMENT '头像Base64编码（含data:image前缀）';
