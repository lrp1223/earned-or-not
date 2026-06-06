package com.earnedornot.service;

import com.earnedornot.dto.PageVO;
import com.earnedornot.dto.RecordRequest;
import com.earnedornot.dto.RecordVO;

import java.math.BigDecimal;

public interface RecordService {

    /**
     * 新增记录
     */
    RecordVO add(Long userId, RecordRequest request);

    /**
     * 编辑记录
     */
    RecordVO update(Long userId, Long recordId, RecordRequest request);

    /**
     * 删除记录
     */
    void delete(Long userId, Long recordId);

    /**
     * 获取单条记录
     */
    RecordVO get(Long userId, Long recordId);

    /**
     * 获取上期同类型彩票中奖金额
     */
    BigDecimal getLastWinAmount(Long userId, String lotteryType);
}
