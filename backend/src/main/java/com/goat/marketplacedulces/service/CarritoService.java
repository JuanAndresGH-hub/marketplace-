// src/main/java/com/goat/marketplacedulces/service/CarritoService.java
package com.goat.marketplacedulces.service;

import com.goat.marketplacedulces.model.Carrito;
import com.goat.marketplacedulces.repository.CarritoRepository;
import com.goat.marketplacedulces.repository.ProductoRepository;
import com.goat.marketplacedulces.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class CarritoService {

    private final CarritoRepository repo;
    private final UsuarioRepository usuarioRepo;
    private final ProductoRepository productoRepo;

    public Mono<Carrito> agregar(String username, Long productoId, Integer cantidad) {
        int qty = (cantidad == null || cantidad <= 0) ? 1 : cantidad;

        // 1) Usuario debe existir
        return usuarioRepo.findByUsername(username)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no existe")))
                .then(
                        // 2) Producto debe existir
                        productoRepo.existsById(productoId).flatMap(exists -> {
                            if (!exists) {
                                return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no existe"));
                            }
                            // 3) Merge: si existe suma cantidad, si no crea
                            return repo.findByUsernameAndProductoId(username, productoId)
                                    .flatMap(item -> {
                                        int nueva = (item.getCantidad() == null ? 0 : item.getCantidad()) + qty;
                                        item.setCantidad(nueva);
                                        return repo.save(item);
                                    })
                                    .switchIfEmpty(repo.save(new Carrito(null, username, productoId, qty)));
                        })
                );
    }

    public Flux<Carrito> verCarrito(String username) {
        return repo.findByUsername(username);
    }

    public Mono<Void> eliminar(Long id) {
        return repo.deleteById(id);
    }
}
