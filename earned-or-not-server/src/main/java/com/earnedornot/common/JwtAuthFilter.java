package com.earnedornot.common;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Public endpoints - no auth required
        if (path.startsWith("/api/user/login")) {
            chain.doFilter(request, response);
            return;
        }

        // JWT verification for all other /api/ paths
        if (path.startsWith("/api/")) {
            String auth = request.getHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                Long userId = jwtUtil.parseUserId(auth.substring(7));
                if (userId != null) {
                    // Pass userId to controllers via request attribute
                    request.setAttribute("userId", userId);
                    chain.doFilter(request, response);
                    return;
                }
            }
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"未登录或登录已过期\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}
