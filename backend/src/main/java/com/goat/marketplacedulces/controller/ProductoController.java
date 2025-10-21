package com.goat.marketplacedulces.controller;

import com.goat.marketplacedulces.model.Producto;
import com.goat.marketplacedulces.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public Flux<Producto> listar() {
        return productoService.listar();
    }

    @GetMapping("/buscar")
    public Flux<Producto> buscar(@RequestParam(required = false) String pais,
                                 @RequestParam(required = false) String tipo) {
        if (pais != null) return productoService.buscarPorPais(pais);
        if (tipo != null) return productoService.buscarPorTipo(tipo);
        return productoService.listar();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<Producto> crear(@RequestBody Producto producto) {
        return productoService.crear(producto);
    }
}
