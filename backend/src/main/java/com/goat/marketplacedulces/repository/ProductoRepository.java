package com.goat.marketplacedulces.repository;

import com.goat.marketplacedulces.model.Producto;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface ProductoRepository extends ReactiveCrudRepository<Producto, Long> {
    Flux<Producto> findByPaisOrigen(String pais);
    Flux<Producto> findByTipo(String tipo);
}


