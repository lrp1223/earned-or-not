package com.earnedornot.service;

import com.earnedornot.dto.RankVO;

public interface RankService {

    /**
     * 排行榜查询
     * @param type 排行类型：total / lottery / scratch / mahjong
     * @param currentUserId 当前用户ID（用于标记isMe）
     */
    RankVO getRank(String type, int page, int pageSize, Long currentUserId);
}
