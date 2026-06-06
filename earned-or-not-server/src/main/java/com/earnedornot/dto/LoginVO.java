package com.earnedornot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginVO {

    private String token;
    private Long userId;
    private String nickname;
    private String avatarUrl;
}
