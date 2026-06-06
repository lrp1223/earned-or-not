package com.earnedornot.controller;

import com.earnedornot.common.Result;
import com.earnedornot.dto.PageVO;
import com.earnedornot.dto.RecordVO;
import com.earnedornot.dto.StatsVO;
import com.earnedornot.service.StatsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/personal")
    public Result<StatsVO> getPersonalStats(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(statsService.getPersonalStats(userId));
    }

    @GetMapping("/recent")
    public Result<List<RecordVO>> getRecentRecords(HttpServletRequest request,
                                                    @RequestParam(defaultValue = "5") int limit) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(statsService.getRecentRecords(userId, limit));
    }

    @GetMapping("/records")
    public Result<PageVO<RecordVO>> getTypeRecords(HttpServletRequest request,
                                                    @RequestParam String type,
                                                    @RequestParam(defaultValue = "1") int page,
                                                    @RequestParam(defaultValue = "10") int pageSize) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(statsService.getTypeRecords(userId, type, page, pageSize));
    }
}
