package com.earnedornot.service.impl;

import com.earnedornot.dto.RecordRequest;
import com.earnedornot.dto.RecordVO;
import com.earnedornot.entity.Record;
import com.earnedornot.entity.Record.RecordType;
import com.earnedornot.repository.RecordRepository;
import com.earnedornot.repository.UserRepository;
import com.earnedornot.service.RecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecordServiceImpl implements RecordService {

    private final RecordRepository recordRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RecordVO add(Long userId, RecordRequest request) {
        Record record = Record.builder()
                .userId(userId)
                .recordType(request.getRecordType())
                .cost(request.getCost() != null ? request.getCost() : BigDecimal.ZERO)
                .winAmount(request.getWinAmount() != null ? request.getWinAmount() : BigDecimal.ZERO)
                .amount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO)
                .lotteryType(request.getLotteryType())
                .remark(request.getRemark())
                .build();

        recordRepository.save(record);

        BigDecimal net = record.getNet();
        if (net.compareTo(BigDecimal.ZERO) != 0) {
            userRepository.updateNet(userId, request.getRecordType().name(), net);
        }

        return toVO(record);
    }

    @Override
    @Transactional
    public RecordVO update(Long userId, Long recordId, RecordRequest request) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("记录不存在"));

        if (!record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权修改");
        }

        BigDecimal oldNet = record.getNet();
        RecordType oldType = record.getRecordType();

        // 应用更新
        record.setRecordType(request.getRecordType());
        record.setCost(request.getCost() != null ? request.getCost() : BigDecimal.ZERO);
        record.setWinAmount(request.getWinAmount() != null ? request.getWinAmount() : BigDecimal.ZERO);
        record.setAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO);
        record.setLotteryType(request.getLotteryType());
        record.setRemark(request.getRemark());

        recordRepository.save(record);

        BigDecimal newNet = record.getNet();
        RecordType newType = record.getRecordType();

        // 先把旧净值从旧类型字段中扣除
        if (oldNet.compareTo(BigDecimal.ZERO) != 0) {
            userRepository.updateNet(userId, oldType.name(), oldNet.negate());
        }
        // 再把新净值加到新类型字段中
        if (newNet.compareTo(BigDecimal.ZERO) != 0) {
            userRepository.updateNet(userId, newType.name(), newNet);
        }

        return toVO(record);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long recordId) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("记录不存在"));

        if (!record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权删除");
        }

        BigDecimal net = record.getNet();

        recordRepository.delete(record);

        // 扣除对应用户的净值
        if (net.compareTo(BigDecimal.ZERO) != 0) {
            userRepository.updateNet(userId, record.getRecordType().name(), net.negate());
        }
    }

    @Override
    public BigDecimal getLastWinAmount(Long userId, String lotteryType) {
        if (lotteryType == null || lotteryType.isEmpty()) {
            return BigDecimal.ZERO;
        }
        Optional<Record> lastRecord = recordRepository
                .findTopByUserIdAndRecordTypeAndLotteryTypeOrderByCreateTimeDesc(
                        userId, RecordType.LOTTERY, lotteryType);
        return lastRecord.map(Record::getWinAmount).orElse(BigDecimal.ZERO);
    }

    @Override
    public RecordVO get(Long userId, Long recordId) {
        Record record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("记录不存在"));
        if (!record.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权查看");
        }
        return toVO(record);
    }

    private RecordVO toVO(Record record) {
        String typeText = switch (record.getRecordType()) {
            case LOTTERY -> "彩";
            case SCRATCH -> "刮";
            case MAHJONG -> "麻将";
        };

        return RecordVO.builder()
                .id(record.getId())
                .recordType(record.getRecordType())
                .typeText(typeText)
                .cost(record.getCost())
                .winAmount(record.getWinAmount())
                .amount(record.getAmount())
                .net(record.getNet())
                .lotteryType(record.getLotteryType())
                .remark(record.getRemark())
                .createTime(record.getCreateTime())
                .build();
    }
}
