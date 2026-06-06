package com.earnedornot.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

@Component
public class JwtUtil {

    @Value("${jwt.secret:earned-or-not-default-secret-key-must-be-at-least-32-chars}")
    private String secret;

    @Value("${jwt.expiration:604800000}") // 7 days
    private long expiration;

    private static final ObjectMapper mapper = new ObjectMapper();

    public String generateToken(Long userId) {
        try {
            long now = Instant.now().getEpochSecond();

            // Header
            String header = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

            // Payload
            ObjectNode payload = mapper.createObjectNode();
            payload.put("sub", String.valueOf(userId));
            payload.put("iat", now);
            payload.put("exp", now + (expiration / 1000));
            String payloadB64 = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(payload.toString().getBytes(StandardCharsets.UTF_8));

            // Signature
            String signingInput = header + "." + payloadB64;
            String signature = sign(signingInput);

            return signingInput + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("JWT generation failed", e);
        }
    }

    public Long parseUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }

            // Verify signature
            String signingInput = parts[0] + "." + parts[1];
            String expectedSig = sign(signingInput);
            if (!expectedSig.equals(parts[2])) {
                return null;
            }

            // Decode payload
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JsonNode payload = mapper.readTree(payloadJson);

            // Check expiration
            long exp = payload.get("exp").asLong();
            if (Instant.now().getEpochSecond() > exp) {
                return null; // expired
            }

            return Long.parseLong(payload.get("sub").asText());
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String input) throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] sigBytes = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(sigBytes);
    }
}
