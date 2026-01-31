package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.infrastructure.persistence.entity.CustomerEntity;
import com.anotame.sales.infrastructure.persistence.repository.CustomerRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class CustomerPersistenceAdapter implements CustomerRepositoryPort {

    @Inject
    CustomerRepository customerRepository;

    @Override
    public Optional<Customer> findById(UUID id) {
        return customerRepository.findByIdOptional(id).map(this::toDomain);
    }

    @Override
    public Optional<Customer> findByEmail(String email) {
        return customerRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public Optional<Customer> findByPhoneNumber(String phoneNumber) {
        return customerRepository.findByPhoneNumber(phoneNumber).map(this::toDomain);
    }

    @Override
    public List<Customer> search(String query) {
        return customerRepository.search(query).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Customer save(Customer customer) {
        CustomerEntity entity;
        if (customer.getId() != null) {
            entity = customerRepository.findById(customer.getId());
            if (entity == null) {
                entity = new CustomerEntity(); // Should handle update vs create appropriately
            }
        } else {
            entity = new CustomerEntity();
        }

        // Map fields
        entity.setFirstName(customer.getFirstName());
        entity.setLastName(customer.getLastName());
        entity.setEmail(customer.getEmail());
        entity.setPhoneNumber(customer.getPhoneNumber());
        entity.setPreferences(customer.getPreferences());
        // ID, CreatedAt, UpdatedAt handled by DB/JPA

        customerRepository.persist(entity);
        return toDomain(entity);
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        customerRepository.delete("id = ?1", id); // Hard delete or soft? Original used @SQLDelete
    }

    private Customer toDomain(CustomerEntity entity) {
        Customer c = new Customer();
        c.setId(entity.getId());
        c.setFirstName(entity.getFirstName());
        c.setLastName(entity.getLastName());
        c.setEmail(entity.getEmail());
        c.setPhoneNumber(entity.getPhoneNumber());
        c.setPreferences(entity.getPreferences());
        c.setCreatedAt(entity.getCreatedAt());
        c.setUpdatedAt(entity.getUpdatedAt());
        c.setDeletedAt(entity.getDeletedAt());
        c.setDeleted(entity.isDeleted());
        return c;
    }
}
