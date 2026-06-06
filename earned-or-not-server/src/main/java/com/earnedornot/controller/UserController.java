package com.earnedornot.controller;

import com.earnedornot.common.Result;
import com.earnedornot.dto.*;
import com.earnedornot.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/identify")
    public Result<IdentifyVO> identify(@Valid @RequestBody IdentifyRequest request) {
        return Result.ok(userService.identify(request));
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
