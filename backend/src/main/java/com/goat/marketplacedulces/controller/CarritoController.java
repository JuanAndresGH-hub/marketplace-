// src/main/java/com/goat/marketplacedulces/controller/CarritoController.java
package com.goat.marketplacedulces.controller;

import com.goat.marketplacedulces.model.Carrito;
import com.goat.marketplacedulces.service.CarritoService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
@RequestMapping("/carrito")
@RequiredArgsConstructor
public class CarritoController {
    private final CarritoService carritoService;

    // Soporta: POST /carrito/agregar?productoId=1&cantidad=2
    @PostMapping("/agregar")
    public Mono<Carrito> agregarQuery(@RequestParam Long productoId,
                                      @RequestParam(required = false) Integer cantidad,
                                      Principal principal) {
        return carritoService.agregar(principal.getName(), productoId, cantidad);
    }

    // Alternativa JSON: { "productoId": 1, "cantidad": 2 }
    @PostMapping(path = "/agregar", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Carrito> agregarBody(@RequestBody AddItem body, Principal principal) {
        return carritoService.agregar(principal.getName(), body.getProductoId(), body.getCantidad());
    }

    @GetMapping
    public Flux<Carrito> verCarrito(Principal principal) {
        return carritoService.verCarrito(principal.getName());
    }

    @DeleteMapping("/{id}")
    public Mono<Void> eliminar(@PathVariable Long id) {
        return carritoService.eliminar(id);
    }

    @Data
    private static class AddItem {
        private Long productoId;
        private Integer cantidad;
    }
}
