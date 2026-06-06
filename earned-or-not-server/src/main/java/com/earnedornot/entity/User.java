package com.earnedornot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "openid", nullable = false, length = 64)
    private String openid;

    @Column(name = "nickname", nullable = false, length = 64)
    @Builder.Default
    private String nickname = "赚了么用户";

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "custom_avatar_url", length = 512)
    private String customAvatarUrl;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "win_color", nullable = false, length = 16)
    @Builder.Default
    private String winColor = "#ff6b6b";

    @Column(name = "lose_color", nullable = false, length = 16)
    @Builder.Default
    private String loseColor = "#4ecdc4";

    @Column(name = "total_net", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(name = "lottery_net", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lotteryNet = BigDecimal.ZERO;

    @Column(name = "scratch_net", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal scratchNet = BigDecimal.ZERO;

    @Column(name = "mahjong_net", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal mahjongNet = BigDecimal.ZERO;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        if (createTime == null) {
            createTime = LocalDateTime.now();
        }
        if (updateTime == null) {
            updateTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
