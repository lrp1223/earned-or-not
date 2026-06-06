package com.earnedornot.service;

import com.earnedornot.dto.*;

public interface UserService {

    /**
     * 微信登录：code换openid，不存在则自动创建用户
     */
    LoginVO login(LoginRequest request);

    /**
     * 获取用户信息
     */
    UserProfileVO getProfile(Long userId);

    /**
     * 更新用户信息
     */
    void updateProfile(Long userId, UserProfileRequest request);

    /**
     * 确保用户存在（记账时兜底），返回用户ID
     */
    Long ensureUser(String openid);
}
