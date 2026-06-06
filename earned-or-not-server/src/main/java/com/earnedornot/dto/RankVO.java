package com.earnedornot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 排行榜响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankVO {

    private List<RankItem> list;
    private boolean hasMore;
    private int total;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RankItem {
        private Long userId;
        private String nickname;
        private String avatarUrl;
        private BigDecimal net;
        private boolean isMe;
    }
}
