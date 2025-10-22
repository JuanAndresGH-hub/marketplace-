package com.goat.marketplacedulces.config;

import com.goat.marketplacedulces.service.JwtService;
import io.jsonwebtoken.JwtException; // <-- importante
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
public class JwtAuthFilter implements WebFilter {

    private final JwtService jwtService;
    private final ReactiveUserDetailsService userDetailsService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // Sin header o sin "Bearer " -> seguir anónimo
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);

        // Token inválido/expirado -> seguir anónimo
        final String username;
        try {
            username = jwtService.extractUsername(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return chain.filter(exchange);
        }

        if (username == null || username.isBlank()) {
            return chain.filter(exchange);
        }

        // Cargar el usuario de forma reactiva y poblar el SecurityContext.
        // Si no existe o hay error, continuamos anónimos.
        return userDetailsService.findByUsername(username)
                .flatMap(ud -> {
                    var auth = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                    return chain.filter(exchange)
                            .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
                })
                .onErrorResume(ex -> chain.filter(exchange)) // p.ej. UsernameNotFoundException
                .switchIfEmpty(chain.filter(exchange));       // usuario no encontrado (Mono.empty)
    }
}
