package com.earnedornot.repository;

import com.earnedornot.entity.Record;
import com.earnedornot.entity.Record.RecordType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecordRepository extends JpaRepository<Record, Long> {

    List<Record> findByUserIdOrderByCreateTimeDesc(Long userId, Pageable pageable);

    Page<Record> findByUserIdAndRecordTypeOrderByCreateTimeDesc(Long userId, RecordType recordType, Pageable pageable);

    /**
     * 查上一个同类型彩票的中奖金额
     */
    Optional<Record> findTopByUserIdAndRecordTypeAndLotteryTypeOrderByCreateTimeDesc(
            Long userId, RecordType recordType, String lotteryType);
}
