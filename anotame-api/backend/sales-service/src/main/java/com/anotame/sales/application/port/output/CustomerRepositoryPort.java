package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.Customer;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepositoryPort {
    Optional<Customer> findById(UUID id);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhoneNumber(String phoneNumber);

    java.util.List<Customer> search(String query);

    Customer save(Customer customer);
}
