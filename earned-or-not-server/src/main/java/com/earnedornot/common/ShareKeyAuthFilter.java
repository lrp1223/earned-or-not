package com.earnedornot.common;

import com.earnedornot.entity.User;
import com.earnedornot.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ShareKeyAuthFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    public ShareKeyAuthFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();

        if (path.startsWith("/api/user/identify")) {
            chain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/api/public/avatar/")) {
            chain.doFilter(request, response);
            return;
        }
        if (path.startsWith("/api/")) {
            String shareKey = request.getHeader("X-Share-Key");

            if (shareKey != null && !shareKey.isEmpty()) {
                User user = userRepository.findByShareKey(shareKey).orElse(null);
                if (user != null) {
                    request.setAttribute("userId", user.getId());
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
