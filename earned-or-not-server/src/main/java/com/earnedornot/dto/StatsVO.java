package com.earnedornot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 个人统计响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsVO {

    private BigDecimal lotteryNet;
    private BigDecimal scratchNet;
    private BigDecimal mahjongNet;
    private BigDecimal totalNet;
}
