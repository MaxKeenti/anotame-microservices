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
        if (email == null) {
            return Optional.empty();
        }
        // JpaRepo doesn't have findByEmail by default unless added.
        // My CustomerJpaRepository didn't define findByEmail explicitly? I need to
        // check.
        // It defined existsByEmail. I need to add findByEmail/Phone to JpaRepo too!
        // But for now let's assume I fix JpaRepo or use example matches.
        // Better: Update JpaRepo first or concurrently.
        return customerRepository.findAll().stream()
                .filter(c -> email.equals(c.getEmail()))
                .findFirst();
        // Optimally, add findByEmail to JpaRepository. I will do that in next step.
    }

    @Override
    public Optional<Customer> findByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null)
            return Optional.empty();
        return customerRepository.findAll().stream()
                .filter(c -> phoneNumber.equals(c.getPhoneNumber()))
                .findFirst();
    }

    @Override
    public List<Customer> search(String query) {
        if (query == null || query.isBlank())
            return List.of();
        return customerRepository.search(query);
    }

    @Override
    public Customer save(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customerRepository.save(customer);
    }
}
