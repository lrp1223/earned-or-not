package com.earnedornot.dto;

import com.earnedornot.entity.Record.RecordType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 记录列表响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordVO {

    private Long id;
    private RecordType recordType;
    private String typeText;
    private BigDecimal cost;
    private BigDecimal winAmount;
    private BigDecimal amount;
    private BigDecimal net;
    private String lotteryType;
    private String remark;
    private LocalDateTime createTime;
}
