package com.earnedornot.service.impl;

import com.earnedornot.dto.RankVO;
import com.earnedornot.repository.UserRepository;
import com.earnedornot.service.RankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankServiceImpl implements RankService {

    private final UserRepository userRepository;

    @Value("${app.public-base-url:https://earned.menghanyu.cn}")
    private String publicBaseUrl;

    @Override
    public RankVO getRank(String type, int page, int pageSize, Long currentUserId) {
        String rankType = mapType(type);
        PageRequest pageable = PageRequest.of(page - 1, pageSize);

        long total = userRepository.countForRank(rankType);

        List<Object[]> rows = userRepository.findForTypeRank(rankType, pageable);

        List<RankVO.RankItem> items = rows.stream()
                .map(row -> {
                    Long userId = ((Number) row[0]).longValue();
                    String nickname = (String) row[1];
                    String customAvatarUrl = (String) row[2];
                    String avatarUrl = (String) row[3];
                    BigDecimal totalNet = (BigDecimal) row[4];
                    BigDecimal lotteryNet = (BigDecimal) row[5];
                    BigDecimal scratchNet = (BigDecimal) row[6];
                    BigDecimal mahjongNet = (BigDecimal) row[7];
                    boolean hasAvatar = ((Number) row[8]).intValue() != 0;

                    BigDecimal net = switch (rankType) {
                        case "LOTTERY" -> lotteryNet;
                        case "SCRATCH" -> scratchNet;
                        case "MAHJONG" -> mahjongNet;
                        default -> totalNet;
                    };

                    String avatar;
                    if (hasAvatar) {
                        avatar = publicBaseUrl + "/api/public/avatar/" + userId;
                    } else {
                        avatar = customAvatarUrl != null && !customAvatarUrl.isEmpty()
                                ? customAvatarUrl : avatarUrl;
                    }

                    return RankVO.RankItem.builder()
                            .userId(String.valueOf(userId))
                            .nickname(nickname)
                            .avatarUrl(avatar)
                            .hasAvatar(hasAvatar)
                            .net(net)
                            .isMe(userId.equals(currentUserId))
                            .build();
                })
                .toList();

        return RankVO.builder()
                .list(items)
                .hasMore((long) page * pageSize < total)
                .total((int) total)
                .build();
    }

    private String mapType(String type) {
        if (type == null) return "TOTAL";
        return switch (type.toUpperCase()) {
            case "LOTTERY" -> "LOTTERY";
            case "SCRATCH" -> "SCRATCH";
            case "MAHJONG" -> "MAHJONG";
            default -> "TOTAL";
        };
    }
}
