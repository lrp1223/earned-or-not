package com.earnedornot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "game_rooms")
public class GameRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 6)
    private String roomCode;

    @Column(name = "host_user_id", nullable = false)
    private Long hostUserId;

    @Column(name = "host_nickname", length = 64)
    private String hostNickname;

    @Column(name = "host_avatar", length = 512)
    private String hostAvatar;

    @Column(columnDefinition = "TEXT")
    private String players;

    @Column(name = "game_data", columnDefinition = "TEXT")
    private String gameData;

    @Column(nullable = false, length = 16)
    private String status;

    @Version
    private Integer version;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

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
}
