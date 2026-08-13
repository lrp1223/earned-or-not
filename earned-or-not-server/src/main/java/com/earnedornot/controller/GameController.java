package com.earnedornot.controller;

import com.earnedornot.common.Result;
import com.earnedornot.service.GameService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @PostMapping("/rooms")
    public Result<Map<String, Object>> createRoom(HttpServletRequest request,
                                                   @RequestBody Map<String, Object> body) {
        Long userId = (Long) request.getAttribute("userId");
        String nickname = (String) body.getOrDefault("nickname", "玩家");
        String avatar = (String) body.getOrDefault("avatar", "");
        return Result.ok(gameService.createRoom(userId, nickname, avatar));
    }

    @GetMapping("/rooms/{roomCode}")
    public Result<Map<String, Object>> getRoom(@PathVariable String roomCode) {
        return Result.ok(gameService.getRoom(roomCode));
    }

    @PostMapping("/rooms/{roomCode}/join")
    public Result<Map<String, Object>> joinRoom(HttpServletRequest request,
                                                 @PathVariable String roomCode,
                                                 @RequestBody Map<String, Object> body) {
        Long userId = (Long) request.getAttribute("userId");
        String nickname = (String) body.getOrDefault("nickname", "玩家");
        String avatar = (String) body.getOrDefault("avatar", "");
        return Result.ok(gameService.joinRoom(roomCode, userId, nickname, avatar));
    }

    @PostMapping("/rooms/{roomCode}/add-ai")
    public Result<Map<String, Object>> addAI(@PathVariable String roomCode) {
        return Result.ok(gameService.addAI(roomCode));
    }

    @PostMapping("/rooms/{roomCode}/start")
    public Result<Map<String, Object>> startGame(HttpServletRequest request,
                                                  @PathVariable String roomCode) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(gameService.startGame(roomCode, userId));
    }

    @PostMapping("/rooms/{roomCode}/play")
    public Result<Map<String, Object>> playCard(HttpServletRequest request,
                                                 @PathVariable String roomCode,
                                                 @RequestBody Map<String, Object> body) {
        Long userId = (Long) request.getAttribute("userId");
        @SuppressWarnings("unchecked")
        Map<String, Object> card = (Map<String, Object>) body.get("card");
        return Result.ok(gameService.playCard(roomCode, userId, card));
    }

    @PostMapping("/rooms/{roomCode}/leave")
    public Result<Void> leaveRoom(HttpServletRequest request,
                                   @PathVariable String roomCode) {
        Long userId = (Long) request.getAttribute("userId");
        gameService.leaveRoom(roomCode, userId);
        return Result.ok();
    }
}
