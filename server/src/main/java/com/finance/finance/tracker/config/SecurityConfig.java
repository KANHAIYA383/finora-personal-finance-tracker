
package com.finance.finance.tracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public UserDetailsService userDetailsService() {
        String username = System.getenv("DEV_AUTH_USERNAME");
        String password = System.getenv("DEV_AUTH_PASSWORD");

        if (username == null || username.isBlank()
                || password == null || password.length() < 12) {
            throw new IllegalStateException(
                "Set DEV_AUTH_USERNAME and DEV_AUTH_PASSWORD (at least 12 characters)."
            );
        }

        return new InMemoryUserDetailsManager(
            User.withUsername(username)
                .password("{noop}" + password)
                .roles("USER")
                .build()
        );
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
