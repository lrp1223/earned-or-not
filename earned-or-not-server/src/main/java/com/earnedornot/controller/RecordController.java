package com.earnedornot.controller;

import com.earnedornot.common.Result;
import com.earnedornot.dto.RecordRequest;
import com.earnedornot.dto.RecordVO;
import com.earnedornot.service.RecordService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    @PostMapping
    public Result<RecordVO> add(HttpServletRequest request,
                                 @Valid @RequestBody RecordRequest body) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(recordService.add(userId, body));
    }

    @GetMapping("/{id}")
    public Result<RecordVO> get(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(recordService.get(userId, id));
    }

    @PutMapping("/{id}")
    public Result<RecordVO> update(HttpServletRequest request,
                                    @PathVariable Long id,
                                    @Valid @RequestBody RecordRequest body) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(recordService.update(userId, id, body));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        recordService.delete(userId, id);
        return Result.ok();
    }

    @GetMapping("/last-win")
    public Result<BigDecimal> getLastWinAmount(HttpServletRequest request,
                                                @RequestParam(required = false) String lotteryType) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(recordService.getLastWinAmount(userId, lotteryType));
    }
}
