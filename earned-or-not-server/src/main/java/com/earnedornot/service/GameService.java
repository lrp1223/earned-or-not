package com.earnedornot.service;

import java.util.Map;

public interface GameService {

    Map<String, Object> createRoom(Long userId, String nickname, String avatar);

    Map<String, Object> joinRoom(String roomCode, Long userId, String nickname, String avatar);

    Map<String, Object> addAI(String roomCode);

    Map<String, Object> startGame(String roomCode, Long userId);

    Map<String, Object> playCard(String roomCode, Long userId, Map<String, Object> card);

    Map<String, Object> getRoom(String roomCode);

    void leaveRoom(String roomCode, Long userId);

    void cleanupOldRooms();
}
