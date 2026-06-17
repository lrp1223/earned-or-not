package com.earnedornot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserProfileVO {

    private Long id;
    private String nickname;
    private String avatarUrl;
    private String avatarBase64;
    private LocalDate birthday;
    private String winColor;
    private String loseColor;
    private BigDecimal totalNet;
    private BigDecimal lotteryNet;
    private BigDecimal scratchNet;
    private BigDecimal mahjongNet;
    private LocalDateTime createTime;

    public UserProfileVO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getAvatarBase64() { return avatarBase64; }
    public void setAvatarBase64(String avatarBase64) { this.avatarBase64 = avatarBase64; }
    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public String getWinColor() { return winColor; }
    public void setWinColor(String winColor) { this.winColor = winColor; }
    public String getLoseColor() { return loseColor; }
    public void setLoseColor(String loseColor) { this.loseColor = loseColor; }
    public BigDecimal getTotalNet() { return totalNet; }
    public void setTotalNet(BigDecimal totalNet) { this.totalNet = totalNet; }
    public BigDecimal getLotteryNet() { return lotteryNet; }
    public void setLotteryNet(BigDecimal lotteryNet) { this.lotteryNet = lotteryNet; }
    public BigDecimal getScratchNet() { return scratchNet; }
    public void setScratchNet(BigDecimal scratchNet) { this.scratchNet = scratchNet; }
    public BigDecimal getMahjongNet() { return mahjongNet; }
    public void setMahjongNet(BigDecimal mahjongNet) { this.mahjongNet = mahjongNet; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String nickname;
        private String avatarUrl;
        private String avatarBase64;
        private LocalDate birthday;
        private String winColor;
        private String loseColor;
        private BigDecimal totalNet;
        private BigDecimal lotteryNet;
        private BigDecimal scratchNet;
        private BigDecimal mahjongNet;
        private LocalDateTime createTime;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder nickname(String nickname) { this.nickname = nickname; return this; }
        public Builder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public Builder avatarBase64(String avatarBase64) { this.avatarBase64 = avatarBase64; return this; }
        public Builder birthday(LocalDate birthday) { this.birthday = birthday; return this; }
        public Builder winColor(String winColor) { this.winColor = winColor; return this; }
        public Builder loseColor(String loseColor) { this.loseColor = loseColor; return this; }
        public Builder totalNet(BigDecimal totalNet) { this.totalNet = totalNet; return this; }
        public Builder lotteryNet(BigDecimal lotteryNet) { this.lotteryNet = lotteryNet; return this; }
        public Builder scratchNet(BigDecimal scratchNet) { this.scratchNet = scratchNet; return this; }
        public Builder mahjongNet(BigDecimal mahjongNet) { this.mahjongNet = mahjongNet; return this; }
        public Builder createTime(LocalDateTime createTime) { this.createTime = createTime; return this; }

        public UserProfileVO build() {
            UserProfileVO vo = new UserProfileVO();
            vo.id = id;
            vo.nickname = nickname;
            vo.avatarUrl = avatarUrl;
            vo.avatarBase64 = avatarBase64;
            vo.birthday = birthday;
            vo.winColor = winColor;
            vo.loseColor = loseColor;
            vo.totalNet = totalNet;
            vo.lotteryNet = lotteryNet;
            vo.scratchNet = scratchNet;
            vo.mahjongNet = mahjongNet;
            vo.createTime = createTime;
            return vo;
        }
    }
}
