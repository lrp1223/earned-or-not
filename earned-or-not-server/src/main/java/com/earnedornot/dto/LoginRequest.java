package com.earnedornot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 微信登录请求（code 换 openid）
 */
@Data
public class LoginRequest {

    @NotBlank(message = "code不能为空")
    private String code;
}
