package com.earnedornot.dto;

import com.earnedornot.entity.Record.RecordType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 新增/编辑记录请求
 */
@Data
public class RecordRequest {

    @NotNull(message = "记录类型不能为空")
    private RecordType recordType;

    @DecimalMin(value = "0", message = "花费不能为负数")
    private BigDecimal cost;

    @DecimalMin(value = "0", message = "中奖金额不能为负数")
    private BigDecimal winAmount;

    private BigDecimal amount;

    private String lotteryType;

    private String remark;
}
