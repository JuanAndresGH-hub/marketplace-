package com.goat.marketplacedulces.service;

import com.goat.marketplacedulces.dto.AuthResponse;
import com.goat.marketplacedulces.dto.LoginRequest;
import com.goat.marketplacedulces.dto.RegisterRequest;
import com.goat.marketplacedulces.model.Usuario;
import com.goat.marketplacedulces.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public Mono<ResponseEntity<String>> register(RegisterRequest request) {
        return usuarioRepository.findByUsername(request.getUsername())
                .flatMap(u -> Mono.error(new IllegalStateException("El usuario ya existe")))
                .switchIfEmpty(Mono.defer(() -> {
                    Usuario u = new Usuario();
                    u.setUsername(request.getUsername());
                    u.setPassword(passwordEncoder.encode(request.getPassword()));
                    u.setRol(request.getRol() == null || request.getRol().isBlank() ? "USUARIO" : request.getRol());
                    u.setEnabled(Boolean.TRUE);
                    return usuarioRepository.save(u);
                }))
                .then(Mono.just(ResponseEntity.ok("ok")));
    }

    public Mono<ResponseEntity<AuthResponse>> login(LoginRequest request) {
        return usuarioRepository.findByUsername(request.getUsername())
                .flatMap(u -> {
                    if (!Boolean.TRUE.equals(u.getEnabled())) {
                        return Mono.error(new IllegalStateException("Usuario deshabilitado"));
                    }
                    if (!passwordEncoder.matches(request.getPassword(), u.getPassword())) {
                        return Mono.error(new IllegalArgumentException("Credenciales inválidas"));
                    }
                    String token = jwtService.generateToken(u.getUsername(), u.getRol());
                    return Mono.just(ResponseEntity.ok(new AuthResponse(token)));
                });
    }
}
