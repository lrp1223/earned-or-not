package com.earnedornot.repository;

import com.earnedornot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
}
