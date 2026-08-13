package com.earnedornot.controller;

import com.earnedornot.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;

@RestController
@RequestMapping("/api/public/avatar")
public class PublicAvatarController {

    private final UserService userService;

    public PublicAvatarController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long userId) {
        String avatarBase64 = userService.getAvatarBase64(userId);
        if (avatarBase64 == null || avatarBase64.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            int comma = avatarBase64.indexOf(',');
            if (comma < 0) {
                return ResponseEntity.notFound().build();
            }

            String header = avatarBase64.substring(0, comma);
            String data = avatarBase64.substring(comma + 1);
            String contentType = "image/jpeg";
            if (header.startsWith("data:")) {
                int semicolon = header.indexOf(';');
                if (semicolon > 5) {
                    contentType = header.substring(5, semicolon);
                }
            }

            byte[] bytes = Base64.getDecoder().decode(data);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=604800")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
