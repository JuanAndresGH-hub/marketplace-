package com.goat.marketplacedulces.service;

import com.goat.marketplacedulces.model.Producto;
import com.goat.marketplacedulces.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    public Flux<Producto> listar() {
        return productoRepository.findAll();
    }

    public Flux<Producto> buscarPorPais(String pais) {
        return productoRepository.findByPaisOrigen(pais);
    }

    public Flux<Producto> buscarPorTipo(String tipo) {
        return productoRepository.findByTipo(tipo);
    }

    public Mono<Producto> crear(Producto producto) {
        return productoRepository.save(producto);
    }
}

