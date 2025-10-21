package com.goat.marketplacedulces.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Table("productos")
public class Producto {
    @Id
    private Long id;
    private String nombre;
    private String tipo;
    @Column("pais_origen")
    private String paisOrigen;
    private Integer precio;   // INTEGER en tu SQL
    private Integer stock;
}
