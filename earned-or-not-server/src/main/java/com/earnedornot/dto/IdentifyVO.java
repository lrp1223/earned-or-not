package com.earnedornot.dto;

public class IdentifyVO {
    private Long userId;
    private String shareKey;
    private String nickname;
    private String avatarUrl;

    public IdentifyVO() {}

    public IdentifyVO(Long userId, String shareKey, String nickname, String avatarUrl) {
        this.userId = userId;
        this.shareKey = shareKey;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getShareKey() { return shareKey; }
    public void setShareKey(String shareKey) { this.shareKey = shareKey; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long userId;
        private String shareKey;
        private String nickname;
        private String avatarUrl;

        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder shareKey(String shareKey) { this.shareKey = shareKey; return this; }
        public Builder nickname(String nickname) { this.nickname = nickname; return this; }
        public Builder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public IdentifyVO build() { return new IdentifyVO(userId, shareKey, nickname, avatarUrl); }
    }
}
