package com.earnedornot.service;

import com.earnedornot.dto.*;

public interface UserService {

    /**
     * 微信 code 换 openid，自动建/查用户，返回 userId + shareKey
     */
    IdentifyVO identify(IdentifyRequest request);

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

    /**
     * 上传头像（Base64）
     */
    void uploadAvatar(Long userId, String avatarBase64);
    Long ensureUser(String openid);
}
