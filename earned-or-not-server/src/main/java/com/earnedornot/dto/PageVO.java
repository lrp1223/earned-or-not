package com.earnedornot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页响应通用包装
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageVO<T> {

    private List<T> list;
    private int page;
    private int pageSize;
    private long total;
    private boolean hasMore;
}
