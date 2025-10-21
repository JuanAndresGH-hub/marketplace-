package com.goat.marketplacedulces.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Table("roles")
public class Rol {
    @Id
    private Long id;
    private String nombre;
}
