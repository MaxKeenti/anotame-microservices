package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.infrastructure.persistence.repository.CustomerJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CustomerPersistenceAdapter implements CustomerRepositoryPort {
    private final CustomerJpaRepository customerRepository;

    @Override
    public Optional<Customer> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return customerRepository.findById(id);
    }

    @Override
    public Optional<Customer> findByEmail(String email) {
        if (email == null)
            return Optional.empty();
        return customerRepository.findByEmail(email);
    }

    @Override
    public Optional<Customer> findByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null)
            return Optional.empty();
        return customerRepository.findByPhoneNumber(phoneNumber);
    }

    @Override
    public List<Customer> search(String query) {
        if (query == null || query.isBlank()) {
            return customerRepository.findAll();
        }
        return customerRepository.search(query);
    }

    @Override
    public Customer save(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customerRepository.save(customer);
    }

    @Override
    public void deleteById(UUID id) {
        if (id != null) {
            customerRepository.deleteById(id);
        }
    }
}
