package com.earnedornot.dto;

import jakarta.validation.constraints.NotBlank;

public class IdentifyRequest {
    @NotBlank(message = "code不能为空")
    private String code;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
