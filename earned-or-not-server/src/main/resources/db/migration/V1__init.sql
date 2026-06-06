-- ============================================
-- V1__init.sql  初始建表
-- ============================================

CREATE TABLE users (
    id              BIGINT          NOT NULL PRIMARY KEY COMMENT '雪花算法ID',
    openid          VARCHAR(64)     NOT NULL COMMENT '微信openid',
    nickname        VARCHAR(64)     NOT NULL DEFAULT '赚了么用户' COMMENT '昵称',
    avatar_url      VARCHAR(512)    DEFAULT '' COMMENT '微信头像（兼容旧版）',
    custom_avatar_url VARCHAR(512)  DEFAULT '' COMMENT '自定义头像',
    birthday        DATE            DEFAULT NULL COMMENT '生日',
    win_color       VARCHAR(16)     NOT NULL DEFAULT '#ff6b6b' COMMENT '自定义赢色',
    lose_color      VARCHAR(16)     NOT NULL DEFAULT '#4ecdc4' COMMENT '自定义亏色',
    total_net       DECIMAL(12,2)   NOT NULL DEFAULT 0 COMMENT '总盈亏',
    lottery_net     DECIMAL(12,2)   NOT NULL DEFAULT 0 COMMENT '彩票盈亏',
    scratch_net     DECIMAL(12,2)   NOT NULL DEFAULT 0 COMMENT '刮刮乐盈亏',
    mahjong_net     DECIMAL(12,2)   NOT NULL DEFAULT 0 COMMENT '麻将盈亏',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE records (
    id              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    user_id         BIGINT          NOT NULL COMMENT 'FK → users.id',
    record_type     VARCHAR(16)     NOT NULL COMMENT 'LOTTERY / SCRATCH / MAHJONG',
    cost            DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '花费（彩/刮用）',
    win_amount      DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '中奖金额（彩/刮用）',
    amount          DECIMAL(10,2)   NOT NULL DEFAULT 0 COMMENT '盈亏（麻将用，正赢负输）',
    lottery_type    VARCHAR(32)     DEFAULT NULL COMMENT '彩票子类型',
    remark          VARCHAR(256)    DEFAULT '' COMMENT '备注',
    create_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_type_time (user_id, record_type, create_time),
    INDEX idx_user_id (user_id),
    INDEX idx_record_type (record_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='记账记录表';
