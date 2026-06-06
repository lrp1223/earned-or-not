package com.earnedornot.service.impl;

import cn.hutool.core.lang.Snowflake;
import cn.hutool.http.HttpUtil;
import com.earnedornot.common.JwtUtil;
import com.earnedornot.config.WeChatConfig;
import com.earnedornot.dto.*;
import com.earnedornot.entity.User;
import com.earnedornot.repository.UserRepository;
import com.earnedornot.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final Snowflake snowflake;
    private final WeChatConfig weChatConfig;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public LoginVO login(LoginRequest request) {
        String openid = resolveOpenid(request.getCode());

        User user = userRepository.findByOpenid(openid)
                .orElseGet(() -> createUser(openid));

        String token = jwtUtil.generateToken(user.getId());

        return LoginVO.builder()
                .token(token)
                .userId(user.getId())
                .nickname(user.getNickname())
                .avatarUrl(user.getCustomAvatarUrl() != null && !user.getCustomAvatarUrl().isEmpty()
                        ? user.getCustomAvatarUrl() : user.getAvatarUrl())
                .build();
    }

    /** Call WeChat code2session API to get real openid */
    private String resolveOpenid(String code) {
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                weChatConfig.getAppId(), weChatConfig.getAppSecret(), code);

        try {
            String body = HttpUtil.get(url, 5000);
            JsonNode json = objectMapper.readTree(body);

            if (json.has("openid")) {
                return json.get("openid").asText();
            }

            log.error("WeChat code2session failed: {}", body);
            throw new IllegalArgumentException("微信登录失败: " + json.path("errmsg").asText("未知错误"));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("WeChat code2session error", e);
            throw new IllegalArgumentException("微信登录服务异常");
        }
    }

    @Override
    public UserProfileVO getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        return toVO(user);
    }

    @Override
    @Transactional
    public void updateProfile(Long userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatarUrl() != null) {
            user.setCustomAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(LocalDate.parse(request.getBirthday()));
        }
        if (request.getWinColor() != null) {
            user.setWinColor(request.getWinColor());
        }
        if (request.getLoseColor() != null) {
            user.setLoseColor(request.getLoseColor());
        }

        userRepository.save(user);
    }

    @Override
    @Transactional
    public Long ensureUser(String openid) {
        return userRepository.findByOpenid(openid)
                .map(User::getId)
                .orElseGet(() -> createUser(openid).getId());
    }

    private User createUser(String openid) {
        User user = User.builder()
                .id(snowflake.nextId())
                .openid(openid)
                .nickname("赚了么用户")
                .winColor("#ff6b6b")
                .loseColor("#4ecdc4")
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .build();
        return userRepository.save(user);
    }

    private UserProfileVO toVO(User user) {
        return UserProfileVO.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .avatarUrl(user.getCustomAvatarUrl() != null && !user.getCustomAvatarUrl().isEmpty()
                        ? user.getCustomAvatarUrl() : user.getAvatarUrl())
                .birthday(user.getBirthday())
                .winColor(user.getWinColor())
                .loseColor(user.getLoseColor())
                .totalNet(user.getTotalNet())
                .lotteryNet(user.getLotteryNet())
                .scratchNet(user.getScratchNet())
                .mahjongNet(user.getMahjongNet())
                .createTime(user.getCreateTime())
                .build();
    }
}
