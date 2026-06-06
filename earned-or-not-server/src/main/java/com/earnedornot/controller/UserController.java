package com.earnedornot.controller;

import com.earnedornot.common.Result;
import com.earnedornot.dto.LoginRequest;
import com.earnedornot.dto.LoginVO;
import com.earnedornot.dto.UserProfileRequest;
import com.earnedornot.dto.UserProfileVO;
import com.earnedornot.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginRequest request) {
        return Result.ok(userService.login(request));
    }

    @GetMapping("/profile")
    public Result<UserProfileVO> getProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(userService.getProfile(userId));
    }

    @PutMapping("/profile")
    public Result<Void> updateProfile(HttpServletRequest request,
                                       @Valid @RequestBody UserProfileRequest req) {
        Long userId = (Long) request.getAttribute("userId");
        userService.updateProfile(userId, req);
        return Result.ok();
    }
}
