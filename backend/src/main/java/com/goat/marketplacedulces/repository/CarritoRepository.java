// src/main/java/com/goat/marketplacedulces/repository/CarritoRepository.java
package com.goat.marketplacedulces.repository;

import com.goat.marketplacedulces.model.Carrito;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CarritoRepository extends R2dbcRepository<Carrito, Long> {
    Flux<Carrito> findByUsername(String username);
    Mono<Carrito> findByUsernameAndProductoId(String username, Long productoId);
}
