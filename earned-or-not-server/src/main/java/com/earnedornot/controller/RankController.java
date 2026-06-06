package com.earnedornot.controller;

import com.earnedornot.common.Result;
import com.earnedornot.dto.RankVO;
import com.earnedornot.service.RankService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rank")
@RequiredArgsConstructor
public class RankController {

    private final RankService rankService;

    @GetMapping
    public Result<RankVO> getRank(HttpServletRequest request,
                                   @RequestParam(defaultValue = "total") String type,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "20") int pageSize) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(rankService.getRank(type, page, pageSize, userId));
    }
}
