package com.earnedornot.service.impl;

import com.earnedornot.entity.GameRoom;
import com.earnedornot.repository.GameRoomRepository;
import com.earnedornot.service.GameService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameServiceImpl implements GameService {

    private final GameRoomRepository gameRoomRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String[] SUITS = {"C", "D", "S", "H"};
    private static final String[] RANKS = {"2","3","4","5","6","7","8","9","10","J","Q","K","A"};
    private static final Map<String, Integer> SCORE_CARDS = Map.ofEntries(
            Map.entry("SQ", -100), Map.entry("DJ", 100),
            Map.entry("HA", -50), Map.entry("HK", -40), Map.entry("HQ", -30), Map.entry("HJ", -20),
            Map.entry("H10", -10), Map.entry("H9", -10), Map.entry("H8", -10),
            Map.entry("H7", -10), Map.entry("H6", -10), Map.entry("H5", -10)
    );

    @Override
    @Transactional
    public Map<String, Object> createRoom(Long userId, String nickname, String avatar) {
        String code;
        do {
            code = String.format("%06d", (int)(Math.random() * 900000) + 100000);
        } while (gameRoomRepository.findByRoomCode(code).isPresent());

        List<Map<String, Object>> players = new ArrayList<>();
        Map<String, Object> host = new LinkedHashMap<>();
        host.put("userId", userId);
        host.put("nickname", nickname != null ? nickname : "玩家");
        host.put("avatar", avatar != null ? avatar : "");
        host.put("seat", 0);
        host.put("isAI", false);
        host.put("isHost", true);
        players.add(host);

        GameRoom room = GameRoom.builder()
                .roomCode(code)
                .hostUserId(userId)
                .hostNickname(host.get("nickname").toString())
                .hostAvatar(host.get("avatar").toString())
                .players(toJson(players))
                .status("WAITING")
                .version(0)
                .build();

        gameRoomRepository.save(room);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roomCode", code);
        result.put("isHost", true);
        result.put("myIndex", 0);
        result.put("players", players);
        result.put("playerCount", 1);
        result.put("status", "WAITING");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> joinRoom(String roomCode, Long userId, String nickname, String avatar) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("房间不存在"));

        if (!"WAITING".equals(room.getStatus())) {
            throw new IllegalArgumentException("游戏已开始");
        }

        List<Map<String, Object>> players = fromJson(room.getPlayers(),
                new TypeReference<List<Map<String, Object>>>() {});

        if (players.size() >= 4) {
            throw new IllegalArgumentException("房间已满");
        }

        boolean alreadyIn = players.stream().anyMatch(p ->
                userId.equals(p.get("userId")));
        if (alreadyIn) {
            throw new IllegalArgumentException("你已在房间中");
        }

        int seat = players.size();
        Map<String, Object> player = new LinkedHashMap<>();
        player.put("userId", userId);
        player.put("nickname", nickname != null ? nickname : "玩家");
        player.put("avatar", avatar != null ? avatar : "");
        player.put("seat", seat);
        player.put("isAI", false);
        players.add(player);

        room.setPlayers(toJson(players));
        gameRoomRepository.save(room);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roomCode", roomCode);
        result.put("isHost", false);
        result.put("myIndex", seat);
        result.put("players", players);
        result.put("playerCount", players.size());
        result.put("status", "WAITING");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> addAI(String roomCode) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("房间不存在"));

        List<Map<String, Object>> players = fromJson(room.getPlayers(),
                new TypeReference<List<Map<String, Object>>>() {});

        if (players.size() >= 4) {
            throw new IllegalArgumentException("房间已满");
        }

        int seat = players.size();
        Map<String, Object> ai = new LinkedHashMap<>();
        ai.put("userId", (long) (100000 + seat));  // dummy AI id
        ai.put("nickname", "机器人" + seat);
        ai.put("avatar", "/images/avatar2.png");
        ai.put("seat", seat);
        ai.put("isAI", true);
        players.add(ai);

        room.setPlayers(toJson(players));
        gameRoomRepository.save(room);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roomCode", roomCode);
        result.put("players", players);
        result.put("playerCount", players.size());
        result.put("status", "WAITING");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> startGame(String roomCode, Long userId) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("房间不存在"));

        if (!room.getHostUserId().equals(userId)) {
            throw new IllegalArgumentException("只有房主可以开始");
        }

        List<Map<String, Object>> players = fromJson(room.getPlayers(),
                new TypeReference<List<Map<String, Object>>>() {});

        if (players.size() < 4) {
            // Fill remaining seats with AI
            while (players.size() < 4) {
                int seat = players.size();
                Map<String, Object> ai = new LinkedHashMap<>();
                ai.put("userId", (long) (100000 + seat));
                ai.put("nickname", "机器人" + seat);
                ai.put("avatar", "/images/avatar2.png");
                ai.put("seat", seat);
                ai.put("isAI", true);
                players.add(ai);
            }
            room.setPlayers(toJson(players));
        }

        // Create and shuffle deck
        List<Map<String, String>> deck = createDeck();
        Collections.shuffle(deck, new Random());

        // Deal cards
        List<List<Map<String, String>>> hands = new ArrayList<>();
        for (int i = 0; i < 4; i++) hands.add(new ArrayList<>());
        for (int i = 0; i < 52; i++) hands.get(i % 4).add(deck.get(i));

        // Sort each hand
        for (List<Map<String, String>> hand : hands) {
            hand.sort(Comparator.comparingInt(this::cardSortValue));
        }

        // Determine teams
        Map<Integer, Integer> teams = determineTeams(hands);

        // Find first player (has SJ)
        int firstPlayer = 0;
        for (int i = 0; i < 4; i++) {
            boolean hasSJ = false;
            for (Map<String, String> c : hands.get(i)) {
                if ("SJ".equals(c.get("id"))) { hasSJ = true; break; }
            }
            if (hasSJ) { firstPlayer = i; break; }
        }

        Map<String, Object> gameData = new LinkedHashMap<>();
        gameData.put("hands", hands);
        gameData.put("currentRound", 1);
        gameData.put("currentPlayer", firstPlayer);
        gameData.put("tableCards", new ArrayList<>());
        gameData.put("leadSuit", null);
        gameData.put("rawScores", Arrays.asList(0, 0, 0, 0));
        gameData.put("collectedScoreCards", Arrays.asList(new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), new ArrayList<>()));
        gameData.put("teams", teams);
        gameData.put("status", "PLAYING");
        gameData.put("totalScores", Arrays.asList(0, 0, 0, 0));
        gameData.put("pigPlayer", -1);
        gameData.put("sheepPlayer", -1);

        room.setGameData(toJson(gameData));
        room.setStatus("PLAYING");
        gameRoomRepository.save(room);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roomCode", roomCode);
        result.put("players", players);
        result.put("status", "PLAYING");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> playCard(String roomCode, Long userId, Map<String, Object> cardData) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("房间不存在"));

        if (!"PLAYING".equals(room.getStatus())) {
            throw new IllegalArgumentException("游戏未在进行");
        }

        List<Map<String, Object>> players = fromJson(room.getPlayers(),
                new TypeReference<List<Map<String, Object>>>() {});
        Map<String, Object> gameData = fromJson(room.getGameData(),
                new TypeReference<Map<String, Object>>() {});

        int currentPlayer = (int) gameData.get("currentPlayer");

        // Verify it's this player's turn
        Map<String, Object> player = players.get(currentPlayer);
        if (!userId.equals(player.get("userId"))) {
            // AI turn - handled by AI logic below
            if (!Boolean.TRUE.equals(player.get("isAI"))) {
                throw new IllegalArgumentException("不是你的回合");
            }
        }

        // For human player, validate card
        Map<String, String> card = new LinkedHashMap<>();
        card.put("suit", (String) cardData.get("suit"));
        card.put("rank", (String) cardData.get("rank"));
        card.put("id", card.get("suit") + card.get("rank"));

        List<List<Map<String, String>>> hands = fromJsonGeneric(gameData.get("hands"));
        List<Map<String, String>> myHand = hands.get(currentPlayer);

        // Check card is in hand
        boolean found = myHand.removeIf(c -> c.get("id").equals(card.get("id")));
        if (!found) {
            throw new IllegalArgumentException("手牌中没有这张牌");
        }

        List<Map<String, Object>> tableCards = fromJsonList(gameData.get("tableCards"));
        String leadSuit = (String) gameData.get("leadSuit");
        int currentRound = (int) gameData.get("currentRound");

        // Validate play rules
        if (currentRound == 1 && tableCards.isEmpty() && !"SJ".equals(card.get("id"))) {
            throw new IllegalArgumentException("第一轮必须先出黑桃J");
        }

        // Apply the play
        Map<String, Object> tableEntry = new LinkedHashMap<>();
        tableEntry.put("player", currentPlayer);
        tableEntry.put("card", card);
        tableCards.add(tableEntry);

        if (tableCards.size() == 1) {
            leadSuit = card.get("suit");
        }

        // Track pig/sheep
        if ("SQ".equals(card.get("id"))) gameData.put("pigPlayer", currentPlayer);
        if ("DJ".equals(card.get("id"))) gameData.put("sheepPlayer", currentPlayer);

        gameData.put("hands", hands);
        gameData.put("tableCards", tableCards);
        gameData.put("leadSuit", leadSuit);

        if (tableCards.size() == 4) {
            endRound(gameData, players);
            gameData.put("tableCards", new ArrayList<>());
            gameData.put("leadSuit", null);
        } else {
            int nextPlayer = getNextPlayer(currentPlayer);
            gameData.put("currentPlayer", nextPlayer);
            gameData.put("tableCards", tableCards);

            // AI auto-play
            while (Boolean.TRUE.equals(players.get((int) gameData.get("currentPlayer")).get("isAI"))
                    && "PLAYING".equals(gameData.get("status"))) {
                aiPlay(gameData, players);
            }
        }

        room.setGameData(toJson(gameData));
        if ("FINISHED".equals(gameData.get("status"))) {
            room.setStatus("FINISHED");
        }
        gameRoomRepository.save(room);

        return buildRoomState(roomCode, players, gameData);
    }

    @Override
    public Map<String, Object> getRoom(String roomCode) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("房间不存在"));

        List<Map<String, Object>> players = fromJson(room.getPlayers(),
                new TypeReference<List<Map<String, Object>>>() {});

        Map<String, Object> gameData = null;
        if (room.getGameData() != null && !room.getGameData().isEmpty()) {
            gameData = fromJson(room.getGameData(),
                    new TypeReference<Map<String, Object>>() {});
        }

        return buildRoomState(roomCode, players, gameData);
    }

    @Override
    @Transactional
    public void leaveRoom(String roomCode, Long userId) {
        GameRoom room = gameRoomRepository.findByRoomCode(roomCode).orElse(null);
        if (room == null) return;

        List<Map<String, Object>> players = fromJson(room.getPlayers(),
                new TypeReference<List<Map<String, Object>>>() {});

        players.removeIf(p -> userId.equals(p.get("userId")));

        if (players.isEmpty()) {
            gameRoomRepository.delete(room);
        } else {
            room.setPlayers(toJson(players));
            if (userId.equals(room.getHostUserId()) && !players.isEmpty()) {
                Map<String, Object> newHost = players.get(0);
                room.setHostUserId(((Number) newHost.get("userId")).longValue());
            }
            gameRoomRepository.save(room);
        }
    }

    @Override
    @Transactional
    public void cleanupOldRooms() {
        gameRoomRepository.findAll().stream()
                .filter(r -> r.getCreateTime().isBefore(LocalDateTime.now().minusHours(2)))
                .forEach(gameRoomRepository::delete);
    }

    // ========== Card Game Logic ==========

    @SuppressWarnings("unchecked")
    private void aiPlay(Map<String, Object> gameData, List<Map<String, Object>> players) {
        int playerIdx = (int) gameData.get("currentPlayer");
        List<List<Map<String, String>>> hands = fromJsonGeneric(gameData.get("hands"));
        List<Map<String, String>> hand = hands.get(playerIdx);
        List<Map<String, Object>> tableCards = fromJsonList(gameData.get("tableCards"));
        String leadSuit = (String) gameData.get("leadSuit");
        int currentRound = (int) gameData.get("currentRound");

        // First round, first play: must play SJ
        if (currentRound == 1 && tableCards.isEmpty()) {
            for (Map<String, String> c : hand) {
                if ("SJ".equals(c.get("id"))) {
                    Map<String, String> chosen = new LinkedHashMap<>(c);
                    // Apply the play
                    applyPlay(gameData, players, playerIdx, chosen, hands, tableCards, leadSuit);
                    return;
                }
            }
        }

        // Filter valid cards
        List<Map<String, String>> validCards = new ArrayList<>();
        for (Map<String, String> c : hand) {
            if (isValidPlay(c, hand, tableCards, leadSuit)) {
                validCards.add(c);
            }
        }

        // Simple AI: prefer safe cards when leading, random otherwise
        Map<String, String> chosen;
        if (tableCards.isEmpty()) {
            // Leading: avoid playing score cards
            List<Map<String, String>> safe = validCards.stream()
                    .filter(c -> !SCORE_CARDS.containsKey(c.get("id")) && !"C10".equals(c.get("id")))
                    .toList();
            chosen = safe.isEmpty() ? validCards.get(0) : safe.get(0);
        } else {
            // Following: play lowest valid card
            validCards.sort(Comparator.comparingInt(c -> cardRankValue(c.get("rank"))));
            chosen = validCards.get(0);
        }

        applyPlay(gameData, players, playerIdx, chosen, hands, tableCards, leadSuit);
    }

    @SuppressWarnings("unchecked")
    private void applyPlay(Map<String, Object> gameData, List<Map<String, Object>> players,
                           int playerIdx, Map<String, String> card,
                           List<List<Map<String, String>>> hands,
                           List<Map<String, Object>> tableCards, String leadSuit) {

        // Remove card from hand
        hands.get(playerIdx).removeIf(c -> c.get("id").equals(card.get("id")));

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("player", playerIdx);
        entry.put("card", card);
        tableCards.add(entry);

        if (tableCards.size() == 1) {
            leadSuit = card.get("suit");
        }

        if ("SQ".equals(card.get("id"))) gameData.put("pigPlayer", playerIdx);
        if ("DJ".equals(card.get("id"))) gameData.put("sheepPlayer", playerIdx);

        gameData.put("hands", hands);
        gameData.put("tableCards", tableCards);
        gameData.put("leadSuit", leadSuit);

        if (tableCards.size() == 4) {
            endRound(gameData, players);
            gameData.put("tableCards", new ArrayList<>());
            gameData.put("leadSuit", null);
        } else {
            int next = getNextPlayer(playerIdx);
            gameData.put("currentPlayer", next);
        }
    }

    @SuppressWarnings("unchecked")
    private void endRound(Map<String, Object> gameData, List<Map<String, Object>> players) {
        List<Map<String, Object>> tableCards = fromJsonList(gameData.get("tableCards"));
        String leadSuit = (String) gameData.get("leadSuit");
        List<Integer> rawScores = fromJsonIntList(gameData.get("rawScores"));
        List<List<Map<String, String>>> collectedScoreCards = fromJsonGenericList(gameData.get("collectedScoreCards"));
        int currentRound = (int) gameData.get("currentRound");

        // Find winner
        int winner = (int) tableCards.get(0).get("player");
        int maxRank = cardRankValue(((Map<String, String>) tableCards.get(0).get("card")).get("rank"));

        for (int i = 1; i < 4; i++) {
            Map<String, String> c = (Map<String, String>) tableCards.get(i).get("card");
            if (c.get("suit").equals(leadSuit)) {
                int rank = cardRankValue(c.get("rank"));
                if (rank > maxRank) {
                    maxRank = rank;
                    winner = (int) tableCards.get(i).get("player");
                }
            }
        }

        // Collect score cards
        int roundRaw = 0;
        for (Map<String, Object> entry : tableCards) {
            Map<String, String> c = (Map<String, String>) entry.get("card");
            String id = c.get("id");
            if (SCORE_CARDS.containsKey(id) || "C10".equals(id) || "H".equals(c.get("suit"))) {
                collectedScoreCards.get(winner).add(c);
            }
            if (SCORE_CARDS.containsKey(id)) {
                roundRaw += SCORE_CARDS.get(id);
            }
        }

        rawScores.set(winner, rawScores.get(winner) + roundRaw);
        gameData.put("rawScores", rawScores);
        gameData.put("collectedScoreCards", collectedScoreCards);
        gameData.put("currentPlayer", winner);

        if (currentRound >= 13) {
            // Game over
            Map<Integer, Integer> teams = fromJsonTeams(gameData.get("teams"));
            List<Integer> totalScores = fromJsonIntList(gameData.get("totalScores"));
            List<Integer> finalScores = calculateFinalScores(rawScores, collectedScoreCards, teams);

            for (int i = 0; i < 4; i++) {
                totalScores.set(i, totalScores.get(i) + finalScores.get(i));
            }

            gameData.put("finalScores", finalScores);
            gameData.put("totalScores", totalScores);
            gameData.put("status", "FINISHED");
        } else {
            gameData.put("currentRound", currentRound + 1);
        }
    }

    private List<Integer> calculateFinalScores(List<Integer> rawScores,
                                                List<List<Map<String, String>>> collected,
                                                Map<Integer, Integer> teams) {
        List<Integer> optimized = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            int score = rawScores.get(i);
            List<Map<String, String>> myCollected = collected.get(i);

            // All hearts bonus
            long heartCount = myCollected.stream().filter(c -> "H".equals(c.get("suit"))).count();
            if (heartCount == 13) score += 400;

            // C10 transformer
            boolean hasC10 = myCollected.stream().anyMatch(c -> "C10".equals(c.get("id")));
            boolean hasOtherScore = myCollected.stream().anyMatch(c ->
                    "SQ".equals(c.get("id")) || "DJ".equals(c.get("id")) || "H".equals(c.get("suit")));
            if (hasC10) {
                if (!hasOtherScore) score = 50;
                else score *= 2;
            }
            optimized.add(score);
        }

        // Average with teammate
        List<Integer> final_ = new ArrayList<>(Arrays.asList(0, 0, 0, 0));
        Set<Integer> processed = new HashSet<>();
        for (int i = 0; i < 4; i++) {
            if (processed.contains(i)) continue;
            int mate = teams.get(i);
            int avg = (int) Math.round((optimized.get(i) + optimized.get(mate)) / 2.0);
            final_.set(i, avg);
            final_.set(mate, avg);
            processed.add(i);
            processed.add(mate);
        }
        return final_;
    }

    private Map<String, Object> buildRoomState(String roomCode, List<Map<String, Object>> players,
                                                Map<String, Object> gameData) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("roomCode", roomCode);
        state.put("players", players);
        state.put("playerCount", players.size());

        if (gameData != null) {
            state.put("status", gameData.getOrDefault("status", "PLAYING"));
            state.put("gameData", gameData);
        } else {
            state.put("status", "WAITING");
        }
        return state;
    }

    // ========== Helpers ==========

    private boolean isValidPlay(Map<String, String> card, List<Map<String, String>> hand,
                                 List<Map<String, Object>> tableCards, String leadSuit) {
        if (tableCards.isEmpty()) return true;
        if (card.get("suit").equals(leadSuit)) return true;
        return hand.stream().noneMatch(c -> c.get("suit").equals(leadSuit));
    }

    private int getNextPlayer(int current) {
        return switch (current) {
            case 0 -> 3;
            case 3 -> 2;
            case 2 -> 1;
            default -> 0;
        };
    }

    private List<Map<String, String>> createDeck() {
        List<Map<String, String>> deck = new ArrayList<>();
        for (String suit : SUITS) {
            for (String rank : RANKS) {
                Map<String, String> card = new LinkedHashMap<>();
                card.put("suit", suit);
                card.put("rank", rank);
                card.put("id", suit + rank);
                deck.add(card);
            }
        }
        return deck;
    }

    private Map<Integer, Integer> determineTeams(List<List<Map<String, String>>> hands) {
        int pigOwner = -1, sheepOwner = -1;
        for (int i = 0; i < 4; i++) {
            for (Map<String, String> c : hands.get(i)) {
                if ("SQ".equals(c.get("id"))) pigOwner = i;
                if ("DJ".equals(c.get("id"))) sheepOwner = i;
            }
        }
        Map<Integer, Integer> teams = new LinkedHashMap<>();
        if (pigOwner == sheepOwner) {
            teams.put(pigOwner, (pigOwner + 2) % 4);
            teams.put((pigOwner + 2) % 4, pigOwner);
            int o1 = (pigOwner + 1) % 4, o2 = (pigOwner + 3) % 4;
            teams.put(o1, o2);
            teams.put(o2, o1);
        } else {
            teams.put(pigOwner, sheepOwner);
            teams.put(sheepOwner, pigOwner);
            List<Integer> others = new ArrayList<>();
            for (int i = 0; i < 4; i++) {
                if (i != pigOwner && i != sheepOwner) others.add(i);
            }
            teams.put(others.get(0), others.get(1));
            teams.put(others.get(1), others.get(0));
        }
        return teams;
    }

    private int cardSortValue(Map<String, String> card) {
        int suitOrder = switch (card.get("suit")) {
            case "S" -> 0; case "C" -> 1; case "D" -> 2; default -> 3;
        };
        int rankOrder = cardRankValue(card.get("rank"));
        return suitOrder * 13 + rankOrder;
    }

    private int cardRankValue(String rank) {
        return switch (rank) {
            case "A" -> 14; case "K" -> 13; case "Q" -> 12; case "J" -> 11;
            case "10" -> 10; case "9" -> 9; case "8" -> 8; case "7" -> 7;
            case "6" -> 6; case "5" -> 5; case "4" -> 4; case "3" -> 3;
            default -> 2;
        };
    }

    // ========== JSON helpers ==========

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { throw new RuntimeException("JSON serialization error", e); }
    }

    private <T> T fromJson(String json, TypeReference<T> typeRef) {
        try { return objectMapper.readValue(json, typeRef); }
        catch (Exception e) { throw new RuntimeException("JSON deserialization error", e); }
    }

    @SuppressWarnings("unchecked")
    private List<List<Map<String, String>>> fromJsonGeneric(Object obj) {
        return objectMapper.convertValue(obj, new TypeReference<List<List<Map<String, String>>>>() {});
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fromJsonList(Object obj) {
        return objectMapper.convertValue(obj, new TypeReference<List<Map<String, Object>>>() {});
    }

    @SuppressWarnings("unchecked")
    private List<Integer> fromJsonIntList(Object obj) {
        return objectMapper.convertValue(obj, new TypeReference<List<Integer>>() {});
    }

    @SuppressWarnings("unchecked")
    private List<List<Map<String, String>>> fromJsonGenericList(Object obj) {
        return objectMapper.convertValue(obj, new TypeReference<List<List<Map<String, String>>>>() {});
    }

    @SuppressWarnings("unchecked")
    private Map<Integer, Integer> fromJsonTeams(Object obj) {
        // Jackson deserializes numeric keys as strings by default; convert
        Map<String, Integer> raw = objectMapper.convertValue(obj, new TypeReference<Map<String, Integer>>() {});
        Map<Integer, Integer> result = new LinkedHashMap<>();
        if (raw != null) {
            raw.forEach((k, v) -> result.put(Integer.parseInt(k), v));
        }
        return result;
    }
}
