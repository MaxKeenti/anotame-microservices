package com.anotame.identity.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChangeCredentialsRequest {
    private String currentPassword;
    private String newUsername;
    private String newPassword;
}
