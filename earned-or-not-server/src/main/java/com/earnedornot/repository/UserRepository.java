package com.earnedornot.repository;

import com.earnedornot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByOpenid(String openid);

    boolean existsByOpenid(String openid);

    /**
     * 原子更新用户盈亏字段，单条SQL保证一致性
     */
    @Modifying
    @Query(value = """
        UPDATE users SET
            total_net   = total_net + :delta,
            lottery_net = CASE WHEN :type = 'LOTTERY' THEN lottery_net + :delta ELSE lottery_net END,
            scratch_net = CASE WHEN :type = 'SCRATCH' THEN scratch_net + :delta ELSE scratch_net END,
            mahjong_net = CASE WHEN :type = 'MAHJONG' THEN mahjong_net + :delta ELSE mahjong_net END
        WHERE id = :userId
    """, nativeQuery = true)
    void updateNet(@Param("userId") Long userId,
                   @Param("type") String type,
                   @Param("delta") BigDecimal delta);

    /**
     * 排行查询：总排行
     */
    @Query("SELECT u FROM User u WHERE u.totalNet != 0 ORDER BY u.totalNet DESC")
    java.util.List<User> findForTotalRank(org.springframework.data.domain.Pageable pageable);

    /**
     * 排行查询：分类排行
     */
    @Query(value = """
        SELECT * FROM users WHERE
            CASE WHEN :type = 'LOTTERY' THEN lottery_net != 0
                 WHEN :type = 'SCRATCH' THEN scratch_net != 0
                 WHEN :type = 'MAHJONG' THEN mahjong_net != 0
                 ELSE total_net != 0
            END
        ORDER BY
            CASE WHEN :type = 'LOTTERY' THEN lottery_net
                 WHEN :type = 'SCRATCH' THEN scratch_net
                 WHEN :type = 'MAHJONG' THEN mahjong_net
                 ELSE total_net
            END DESC
    """, nativeQuery = true)
    java.util.List<User> findForTypeRank(@Param("type") String type,
                                          org.springframework.data.domain.Pageable pageable);

    /**
     * 排行总数
     */
    @Query(value = """
        SELECT COUNT(*) FROM users WHERE
            CASE WHEN :type = 'LOTTERY' THEN lottery_net != 0
                 WHEN :type = 'SCRATCH' THEN scratch_net != 0
                 WHEN :type = 'MAHJONG' THEN mahjong_net != 0
                 ELSE total_net != 0
            END
    """, nativeQuery = true)
    long countForRank(@Param("type") String type);
}
