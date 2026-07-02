package com.earnedornot.service.impl;

import cn.hutool.core.lang.Snowflake;
import cn.hutool.http.HttpUtil;
import com.earnedornot.config.WeChatConfig;
import com.earnedornot.dto.*;
import com.earnedornot.entity.User;
import com.earnedornot.repository.UserRepository;
import com.earnedornot.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final Snowflake snowflake;
    private final WeChatConfig weChatConfig;
    private final ObjectMapper objectMapper;

    public UserServiceImpl(UserRepository userRepository, Snowflake snowflake,
                           WeChatConfig weChatConfig, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.snowflake = snowflake;
        this.weChatConfig = weChatConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public IdentifyVO identify(IdentifyRequest request) {
        String openid = resolveOpenid(request.getCode());

        User user = userRepository.findByOpenid(openid)
                .orElseGet(() -> createUser(openid));

        if (user.getShareKey() == null || user.getShareKey().isEmpty()) {
            user.setShareKey(generateShareKey());
            userRepository.save(user);
        }

        return IdentifyVO.builder()
                .userId(user.getId())
                .shareKey(user.getShareKey())
                .nickname(user.getNickname())
                .avatarUrl(user.getCustomAvatarUrl() != null && !user.getCustomAvatarUrl().isEmpty()
                        ? user.getCustomAvatarUrl() : user.getAvatarUrl())
                .build();
    }

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
    public void uploadAvatar(Long userId, String avatarBase64) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setAvatarBase64(avatarBase64);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void updateProfile(Long userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        if (request.getNickname() != null) {
            String nickname = request.getNickname().trim();
            if (nickname.isEmpty()) {
                throw new IllegalArgumentException("昵称不能为空");
            }
            user.setNickname(nickname);
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
                .shareKey(generateShareKey())
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .build();
        return userRepository.save(user);
    }

    private String generateShareKey() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private UserProfileVO toVO(User user) {
        return UserProfileVO.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .avatarUrl(user.getCustomAvatarUrl() != null && !user.getCustomAvatarUrl().isEmpty()
                        ? user.getCustomAvatarUrl() : user.getAvatarUrl())
                .avatarBase64(user.getAvatarBase64())
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
