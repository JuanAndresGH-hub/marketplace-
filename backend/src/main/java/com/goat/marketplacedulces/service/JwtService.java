package com.goat.marketplacedulces.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.Duration;
import java.util.Date;

@Service
public class JwtService {

    // Puedes sobreescribirla vía variable de entorno JWT_SECRET si quieres
    private static final String DEFAULT_SECRET = "dulcemarket-super-secret-key-32bytes!!";
    private static final Duration EXPIRATION = Duration.ofHours(2);

    private final SecretKey key = Keys.hmacShaKeyFor(
            System.getenv().getOrDefault("JWT_SECRET", DEFAULT_SECRET)
                    .getBytes(StandardCharsets.UTF_8)
    );

    /** Token con claims básicos (subject=username y claim "role"). */
    public String generateToken(String username, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(EXPIRATION)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Overload para compatibilidad: por defecto rol USUARIO. */
    public String generateToken(String username) {
        return generateToken(username, "USUARIO");
    }

    /** Extrae el username (subject). */
    public String extractUsername(String token) {
        return getAllClaims(token).getSubject();
    }

    /** Extrae el rol. Devuelve null si no existe. */
    public String extractRole(String token) {
        Object r = getAllClaims(token).get("role");
        return r != null ? r.toString() : null;
    }

    /** Valida subject y expiración. */
    public boolean isTokenValid(String token, String expectedUsername) {
        try {
            Claims claims = getAllClaims(token);
            boolean notExpired = claims.getExpiration() != null && claims.getExpiration().after(new Date());
            boolean matchesUser = expectedUsername == null || expectedUsername.equals(claims.getSubject());
            return notExpired && matchesUser;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getAllClaims(String token) {
        // Si usas clocks skew, puedes añadir: .setAllowedClockSkewSeconds(60)
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
