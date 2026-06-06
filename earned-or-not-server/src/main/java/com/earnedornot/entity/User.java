package com.earnedornot.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "openid", nullable = false, length = 64)
    private String openid;

    @Column(name = "nickname", nullable = false, length = 64)
    private String nickname = "赚了么用户";

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "custom_avatar_url", length = 512)
    private String customAvatarUrl;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "win_color", nullable = false, length = 16)
    private String winColor = "#ff6b6b";

    @Column(name = "lose_color", nullable = false, length = 16)
    private String loseColor = "#4ecdc4";

    @Column(name = "total_net", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(name = "lottery_net", nullable = false, precision = 12, scale = 2)
    private BigDecimal lotteryNet = BigDecimal.ZERO;

    @Column(name = "scratch_net", nullable = false, precision = 12, scale = 2)
    private BigDecimal scratchNet = BigDecimal.ZERO;

    @Column(name = "mahjong_net", nullable = false, precision = 12, scale = 2)
    private BigDecimal mahjongNet = BigDecimal.ZERO;

    @Column(name = "share_key", length = 64)
    private String shareKey;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    public User() {}

    public User(Long id, String openid, String nickname, String avatarUrl, String customAvatarUrl,
                LocalDate birthday, String winColor, String loseColor, BigDecimal totalNet,
                BigDecimal lotteryNet, BigDecimal scratchNet, BigDecimal mahjongNet,
                String shareKey, LocalDateTime createTime, LocalDateTime updateTime) {
        this.id = id;
        this.openid = openid;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.customAvatarUrl = customAvatarUrl;
        this.birthday = birthday;
        this.winColor = winColor;
        this.loseColor = loseColor;
        this.totalNet = totalNet;
        this.lotteryNet = lotteryNet;
        this.scratchNet = scratchNet;
        this.mahjongNet = mahjongNet;
        this.shareKey = shareKey;
        this.createTime = createTime;
        this.updateTime = updateTime;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createTime == null) createTime = now;
        if (updateTime == null) updateTime = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    // --- Getters ---
    public Long getId() { return id; }
    public String getOpenid() { return openid; }
    public String getNickname() { return nickname; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getCustomAvatarUrl() { return customAvatarUrl; }
    public LocalDate getBirthday() { return birthday; }
    public String getWinColor() { return winColor; }
    public String getLoseColor() { return loseColor; }
    public BigDecimal getTotalNet() { return totalNet; }
    public BigDecimal getLotteryNet() { return lotteryNet; }
    public BigDecimal getScratchNet() { return scratchNet; }
    public BigDecimal getMahjongNet() { return mahjongNet; }
    public String getShareKey() { return shareKey; }
    public LocalDateTime getCreateTime() { return createTime; }
    public LocalDateTime getUpdateTime() { return updateTime; }

    // --- Setters ---
    public void setId(Long id) { this.id = id; }
    public void setOpenid(String openid) { this.openid = openid; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setCustomAvatarUrl(String customAvatarUrl) { this.customAvatarUrl = customAvatarUrl; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public void setWinColor(String winColor) { this.winColor = winColor; }
    public void setLoseColor(String loseColor) { this.loseColor = loseColor; }
    public void setTotalNet(BigDecimal totalNet) { this.totalNet = totalNet; }
    public void setLotteryNet(BigDecimal lotteryNet) { this.lotteryNet = lotteryNet; }
    public void setScratchNet(BigDecimal scratchNet) { this.scratchNet = scratchNet; }
    public void setMahjongNet(BigDecimal mahjongNet) { this.mahjongNet = mahjongNet; }
    public void setShareKey(String shareKey) { this.shareKey = shareKey; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }

    // --- Builder ---
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String openid;
        private String nickname = "赚了么用户";
        private String avatarUrl;
        private String customAvatarUrl;
        private LocalDate birthday;
        private String winColor = "#ff6b6b";
        private String loseColor = "#4ecdc4";
        private BigDecimal totalNet = BigDecimal.ZERO;
        private BigDecimal lotteryNet = BigDecimal.ZERO;
        private BigDecimal scratchNet = BigDecimal.ZERO;
        private BigDecimal mahjongNet = BigDecimal.ZERO;
        private String shareKey;
        private LocalDateTime createTime;
        private LocalDateTime updateTime;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder openid(String openid) { this.openid = openid; return this; }
        public Builder nickname(String nickname) { this.nickname = nickname; return this; }
        public Builder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public Builder customAvatarUrl(String customAvatarUrl) { this.customAvatarUrl = customAvatarUrl; return this; }
        public Builder birthday(LocalDate birthday) { this.birthday = birthday; return this; }
        public Builder winColor(String winColor) { this.winColor = winColor; return this; }
        public Builder loseColor(String loseColor) { this.loseColor = loseColor; return this; }
        public Builder totalNet(BigDecimal totalNet) { this.totalNet = totalNet; return this; }
        public Builder lotteryNet(BigDecimal lotteryNet) { this.lotteryNet = lotteryNet; return this; }
        public Builder scratchNet(BigDecimal scratchNet) { this.scratchNet = scratchNet; return this; }
        public Builder mahjongNet(BigDecimal mahjongNet) { this.mahjongNet = mahjongNet; return this; }
        public Builder shareKey(String shareKey) { this.shareKey = shareKey; return this; }
        public Builder createTime(LocalDateTime createTime) { this.createTime = createTime; return this; }
        public Builder updateTime(LocalDateTime updateTime) { this.updateTime = updateTime; return this; }

        public User build() {
            return new User(id, openid, nickname, avatarUrl, customAvatarUrl, birthday,
                    winColor, loseColor, totalNet, lotteryNet, scratchNet, mahjongNet,
                    shareKey, createTime, updateTime);
        }
    }
}
