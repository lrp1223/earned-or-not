package com.earnedornot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "records", indexes = {
        @Index(name = "idx_user_type_time", columnList = "userId, recordType, createTime"),
        @Index(name = "idx_user_id", columnList = "userId"),
        @Index(name = "idx_record_type", columnList = "recordType")
})
public class Record {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false, length = 16)
    private RecordType recordType;

    @Column(name = "cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "win_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal winAmount = BigDecimal.ZERO;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "lottery_type", length = 32)
    private String lotteryType;

    @Column(name = "remark", length = 256)
    private String remark;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createTime == null) {
            createTime = now;
        }
        if (updateTime == null) {
            updateTime = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }

    /**
     * 计算本条记录的净盈亏
     */
    public BigDecimal getNet() {
        return switch (recordType) {
            case LOTTERY, SCRATCH -> winAmount.subtract(cost);
            case MAHJONG -> amount;
        };
    }

    public enum RecordType {
        LOTTERY,   // 彩票
        SCRATCH,   // 刮刮乐
        MAHJONG    // 麻将
    }
}
