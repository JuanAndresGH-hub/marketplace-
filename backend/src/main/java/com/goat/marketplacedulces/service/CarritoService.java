// src/main/java/com/goat/marketplacedulces/service/CarritoService.java
package com.goat.marketplacedulces.service;

import com.goat.marketplacedulces.model.Carrito;
import com.goat.marketplacedulces.repository.CarritoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class CarritoService {

    private final CarritoRepository repo;

    public Mono<Carrito> agregar(String username, Long productoId, Integer cantidad) {
        int qty = (cantidad == null || cantidad <= 0) ? 1 : cantidad;

        return repo.findByUsernameAndProductoId(username, productoId)
                .flatMap(exists -> {
                    int nueva = (exists.getCantidad() == null ? 0 : exists.getCantidad()) + qty;
                    exists.setCantidad(nueva);
                    return repo.save(exists);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    Carrito c = new Carrito(null, username, productoId, qty);
                    return repo.save(c);
                }));
    }

    public Flux<Carrito> verCarrito(String username) {
        return repo.findByUsername(username);
    }

    public Mono<Void> eliminar(Long id) {
        return repo.deleteById(id);
    }
}
