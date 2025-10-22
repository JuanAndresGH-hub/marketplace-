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
import reactor.core.publisher.Mono; // solo si usas new HashMap<>(...)
import java.util.Map;
import java.util.HashMap; // si usas new HashMap<>(...)
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository; // o tu repo
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;

    public Mono<Map<String,String>> login(String username, String rawPassword) {
        return usuarioRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(new BadCredentialsException("Credenciales inválidas")))
                .flatMap(u -> {
                    if (!u.getEnabled()) return Mono.error(new DisabledException("Usuario deshabilitado"));
                    if (!passwordEncoder.matches(rawPassword, u.getPassword()))
                        return Mono.error(new BadCredentialsException("Credenciales inválidas"));

                    String token = jwt.generateToken(u.getUsername()); // ajusta claims/rol si usas
                    return Mono.just(Map.of("token", token));
                });
    }

    public Mono<Void> register(String username, String rawPassword, String rol) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword)); // IMPORTANTE
        u.setRol(rol != null ? rol : "USUARIO");
        u.setEnabled(true);
        return usuarioRepository.save(u).then();
    }
}

