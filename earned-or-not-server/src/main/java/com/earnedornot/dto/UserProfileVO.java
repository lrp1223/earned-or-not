package com.earnedornot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户信息响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileVO {

    private Long id;
    private String nickname;
    private String avatarUrl;
    private LocalDate birthday;
    private String winColor;
    private String loseColor;
    private BigDecimal totalNet;
    private BigDecimal lotteryNet;
    private BigDecimal scratchNet;
    private BigDecimal mahjongNet;
    private LocalDateTime createTime;
}
