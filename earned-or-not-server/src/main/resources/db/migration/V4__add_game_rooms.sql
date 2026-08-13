-- V4__add_game_rooms.sql
-- 拱猪在线对战房间

CREATE TABLE IF NOT EXISTS game_rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(6) NOT NULL UNIQUE,
    host_user_id BIGINT NOT NULL,
    host_nickname VARCHAR(64) DEFAULT '玩家',
    host_avatar VARCHAR(512) DEFAULT '',
    players TEXT COMMENT 'JSON: [{userId, nickname, avatar, seat, isAI}, ...]',
    game_data TEXT COMMENT 'JSON: 当前游戏状态',
    status VARCHAR(16) NOT NULL DEFAULT 'WAITING',
    version INT NOT NULL DEFAULT 0,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_code (room_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
