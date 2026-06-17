package com.earnedornot.dto;

import jakarta.validation.constraints.NotBlank;

public class AvatarUploadRequest {
    @NotBlank(message = "avatarBase64不能为空")
    private String avatarBase64;

    public String getAvatarBase64() { return avatarBase64; }
    public void setAvatarBase64(String avatarBase64) { this.avatarBase64 = avatarBase64; }
}
