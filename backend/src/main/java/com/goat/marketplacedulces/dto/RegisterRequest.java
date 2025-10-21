package com.goat.marketplacedulces.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String rol; // ADMIN o USUARIO
}

