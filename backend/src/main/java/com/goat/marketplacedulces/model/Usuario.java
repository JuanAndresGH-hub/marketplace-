package com.goat.marketplacedulces.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Table("usuarios")
public class Usuario {
    @Id
    private Long id;
    private String username;
    private String password;
    private String rol;       // "USUARIO" | "ADMIN"
    private Boolean enabled;  // default true
}
