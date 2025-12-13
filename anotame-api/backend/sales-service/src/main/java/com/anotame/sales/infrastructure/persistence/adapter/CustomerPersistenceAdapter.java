package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.infrastructure.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CustomerPersistenceAdapter implements CustomerRepositoryPort {
    private final CustomerRepository customerRepository;

    @Override
    public Optional<Customer> findById(UUID id) {
        return customerRepository.findById(id);
    }

    @Override
    public Optional<Customer> findByEmail(String email) {
        return customerRepository.findByEmail(email);
    }

    @Override
    public Customer save(Customer customer) {
        return customerRepository.save(customer);
    }
}
