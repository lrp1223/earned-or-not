package com.earnedornot.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一响应体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private boolean success;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        return new Result<>(true, null, data);
    }

    public static <T> Result<T> ok() {
        return new Result<>(true, null, null);
    }

    public static <T> Result<T> fail(String message) {
        return new Result<>(false, message, null);
    }
}
