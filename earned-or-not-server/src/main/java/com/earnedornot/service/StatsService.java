package com.earnedornot.service;

import com.earnedornot.dto.PageVO;
import com.earnedornot.dto.RecordVO;
import com.earnedornot.dto.StatsVO;

public interface StatsService {

    /**
     * 个人总览统计
     */
    StatsVO getPersonalStats(Long userId);

    /**
     * 最近N条记录（三类混合，按时间倒序）
     */
    java.util.List<RecordVO> getRecentRecords(Long userId, int limit);

    /**
     * 分类记录分页
     */
    PageVO<RecordVO> getTypeRecords(Long userId, String type, int page, int pageSize);
}
