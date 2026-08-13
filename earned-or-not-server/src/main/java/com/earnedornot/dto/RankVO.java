package com.earnedornot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

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
        private String userId;
        private String nickname;
        private String avatarUrl;
        private boolean hasAvatar;
        private BigDecimal net;
        @JsonProperty("isMe")
        private boolean isMe;
    }
}
