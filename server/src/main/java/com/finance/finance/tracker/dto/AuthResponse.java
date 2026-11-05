
package com.finance.finance.tracker.dto;

public class AuthResponse {

    private Long id;
    private String fullName;
    private String email;

    public AuthResponse(Long id, String fullName, String email) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }
}
