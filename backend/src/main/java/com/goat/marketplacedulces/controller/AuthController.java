// backend/src/main/java/com/goat/marketplacedulces/controller/AuthController.java
package com.goat.marketplacedulces.controller;

import com.goat.marketplacedulces.dto.LoginRequest;
import com.goat.marketplacedulces.dto.RegisterRequest;
import com.goat.marketplacedulces.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Mono<Map<String, String>> login(@RequestBody LoginRequest body) {
        // El service recibe Strings
        return authService.login(body.getUsername(), body.getPassword());
    }

    @PostMapping("/register")
    public Mono<?> register(@RequestBody RegisterRequest body) {
        // El service recibe Strings (username, password, rol)
        return authService.register(body.getUsername(), body.getPassword(), body.getRol());
    }
}
