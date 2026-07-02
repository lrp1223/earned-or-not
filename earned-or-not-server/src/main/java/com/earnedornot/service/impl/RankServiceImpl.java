package com.earnedornot.service.impl;

import com.earnedornot.dto.RankVO;
import com.earnedornot.entity.User;
import com.earnedornot.repository.UserRepository;
import com.earnedornot.service.RankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankServiceImpl implements RankService {

    private final UserRepository userRepository;

    @Override
    public RankVO getRank(String type, int page, int pageSize, Long currentUserId) {
        String rankType = mapType(type);
        PageRequest pageable = PageRequest.of(page - 1, pageSize);

        List<User> users = userRepository.findForTypeRank(rankType, pageable);
        long total = userRepository.countForRank(rankType);

        List<RankVO.RankItem> items = users.stream()
                .map(user -> {
                    BigDecimal net = switch (rankType) {
                        case "LOTTERY" -> user.getLotteryNet();
                        case "SCRATCH" -> user.getScratchNet();
                        case "MAHJONG" -> user.getMahjongNet();
                        default -> user.getTotalNet();
                    };
                    String avatar;
                    if (user.getAvatarBase64() != null && !user.getAvatarBase64().isEmpty()) {
                        avatar = user.getAvatarBase64();
                    } else if (user.getCustomAvatarUrl() != null && !user.getCustomAvatarUrl().isEmpty()) {
                        avatar = user.getCustomAvatarUrl();
                    } else {
                        avatar = user.getAvatarUrl();
                    }
                    return RankVO.RankItem.builder()
                            .userId(user.getId())
                            .nickname(user.getNickname())
                            .avatarUrl(avatar)
                            .net(net)
                            .isMe(user.getId().equals(currentUserId))
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
