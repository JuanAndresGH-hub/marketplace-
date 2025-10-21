// src/main/java/com/goat/marketplacedulces/model/Carrito.java
package com.goat.marketplacedulces.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("carrito")
public class Carrito {
    @Id
    private Long id;

    // guardamos el username del Principal
    @Column("username")
    private String username;

    // OJO: columna con underscore en la BD
    @Column("producto_id")
    private Long productoId;

    @Column("cantidad")
    private Integer cantidad;
}
