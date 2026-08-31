package com.earnedornot.repository;

import com.earnedornot.entity.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByOpenid(String openid);

    Optional<User> findByShareKey(String shareKey);

    /**
     * 在同一事务内原子更新用户缓存净值
     * total_net = total_net + :delta
     * lottery_net / scratch_net / mahjong_net 按 recordType 更新
     */
    @Modifying
    @Query(value = "UPDATE users SET total_net = total_net + :delta, " +
            "lottery_net = CASE WHEN :type = 'LOTTERY' THEN lottery_net + :delta ELSE lottery_net END, " +
            "scratch_net = CASE WHEN :type = 'SCRATCH' THEN scratch_net + :delta ELSE scratch_net END, " +
            "mahjong_net = CASE WHEN :type = 'MAHJONG' THEN mahjong_net + :delta ELSE mahjong_net END, " +
            "update_time = NOW() WHERE id = :userId", nativeQuery = true)
    void updateNet(@Param("userId") Long userId, @Param("type") String type, @Param("delta") BigDecimal delta);

    /**
     * 分页排行查询：按指定净值字段升序（从小到大），仅包含有记录的用户
     */
    @Query(value = "SELECT id, nickname, custom_avatar_url, avatar_url, " +
            "total_net, lottery_net, scratch_net, mahjong_net, " +
            "CASE WHEN avatar_base64 IS NOT NULL AND LENGTH(avatar_base64) > 0 THEN 1 ELSE 0 END AS has_avatar " +
            "FROM users WHERE " +
            "CASE :type WHEN 'LOTTERY' THEN lottery_net WHEN 'SCRATCH' THEN scratch_net " +
            "WHEN 'MAHJONG' THEN mahjong_net ELSE total_net END IS NOT NULL " +
            "AND id IN (SELECT DISTINCT user_id FROM records) " +
            "ORDER BY CASE :type WHEN 'LOTTERY' THEN lottery_net WHEN 'SCRATCH' THEN scratch_net " +
            "WHEN 'MAHJONG' THEN mahjong_net ELSE total_net END ASC", nativeQuery = true)
    List<Object[]> findForTypeRank(@Param("type") String type, PageRequest pageable);

    /**
     * 排行总数：统计指定净值字段非空且有记录的用户数
     */
    @Query(value = "SELECT COUNT(*) FROM users WHERE " +
            "CASE :type WHEN 'LOTTERY' THEN lottery_net WHEN 'SCRATCH' THEN scratch_net " +
            "WHEN 'MAHJONG' THEN mahjong_net ELSE total_net END IS NOT NULL " +
            "AND id IN (SELECT DISTINCT user_id FROM records)", nativeQuery = true)
    long countForRank(@Param("type") String type);
}
