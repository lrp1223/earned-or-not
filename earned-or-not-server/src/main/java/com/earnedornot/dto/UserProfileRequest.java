package com.earnedornot.dto;

import lombok.Data;

/**
 * 更新用户信息请求
 */
@Data
public class UserProfileRequest {

    private String nickname;
    private String avatarUrl;
    private String birthday;
    private String winColor;
    private String loseColor;
}
