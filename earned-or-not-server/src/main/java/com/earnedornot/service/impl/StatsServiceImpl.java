package com.earnedornot.service.impl;

import com.earnedornot.dto.PageVO;
import com.earnedornot.dto.RecordVO;
import com.earnedornot.dto.StatsVO;
import com.earnedornot.entity.Record;
import com.earnedornot.entity.User;
import com.earnedornot.repository.RecordRepository;
import com.earnedornot.repository.UserRepository;
import com.earnedornot.service.StatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final UserRepository userRepository;
    private final RecordRepository recordRepository;

    @Override
    public StatsVO getPersonalStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        // 直接读 users 表的缓存净值，无需聚合查询
        return StatsVO.builder()
                .lotteryNet(user.getLotteryNet())
                .scratchNet(user.getScratchNet())
                .mahjongNet(user.getMahjongNet())
                .totalNet(user.getTotalNet())
                .build();
    }

    @Override
    public List<RecordVO> getRecentRecords(Long userId, int limit) {
        // 查三类记录各自最近N条，再合并排序
        List<RecordVO> all = new ArrayList<>();

        recordRepository.findByUserIdAndRecordTypeOrderByCreateTimeDesc(
                        userId, Record.RecordType.LOTTERY, PageRequest.of(0, limit))
                .forEach(r -> all.add(toVO(r)));

        recordRepository.findByUserIdAndRecordTypeOrderByCreateTimeDesc(
                        userId, Record.RecordType.SCRATCH, PageRequest.of(0, limit))
                .forEach(r -> all.add(toVO(r)));

        recordRepository.findByUserIdAndRecordTypeOrderByCreateTimeDesc(
                        userId, Record.RecordType.MAHJONG, PageRequest.of(0, limit))
                .forEach(r -> all.add(toVO(r)));

        all.sort(Comparator.comparing(RecordVO::getCreateTime, Comparator.nullsLast(Comparator.reverseOrder())));

        return all.stream().limit(limit).toList();
    }

    @Override
    public PageVO<RecordVO> getTypeRecords(Long userId, String type, int page, int pageSize) {
        Record.RecordType recordType = switch (type.toUpperCase()) {
            case "LOTTERY" -> Record.RecordType.LOTTERY;
            case "SCRATCH" -> Record.RecordType.SCRATCH;
            case "MAHJONG" -> Record.RecordType.MAHJONG;
            default -> throw new IllegalArgumentException("未知类型: " + type);
        };

        Page<Record> result = recordRepository.findByUserIdAndRecordTypeOrderByCreateTimeDesc(
                userId, recordType, PageRequest.of(page - 1, pageSize));

        List<RecordVO> vos = result.getContent().stream()
                .map(this::toVO)
                .sorted(Comparator.comparing(RecordVO::getNet).reversed())
                .toList();

        return PageVO.<RecordVO>builder()
                .list(vos)
                .page(page)
                .pageSize(pageSize)
                .total(result.getTotalElements())
                .hasMore(result.hasNext())
                .build();
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
