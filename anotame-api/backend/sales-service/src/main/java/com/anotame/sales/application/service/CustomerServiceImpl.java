package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.CustomerDto;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.domain.model.Customer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl {

    private final CustomerRepositoryPort customerRepository;

    @Transactional
    public CustomerDto createCustomer(CustomerDto dto) {
        if (dto.getEmail() != null && customerRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        if (dto.getPhoneNumber() != null && customerRepository.findByPhoneNumber(dto.getPhoneNumber()).isPresent()) {
            throw new RuntimeException("Phone number already in use");
        }

        Customer customer = new Customer();
        customer.setFirstName(dto.getFirstName());
        customer.setLastName(dto.getLastName());
        customer.setEmail(dto.getEmail());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setPreferences(dto.getPreferences());

        Customer saved = customerRepository.save(customer);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomer(UUID id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return mapToDto(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> searchCustomers(String query) {
        return customerRepository.search(query).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerDto updateCustomer(UUID id, CustomerDto dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (dto.getEmail() != null && !dto.getEmail().equals(customer.getEmail())) {
            if (customerRepository.findByEmail(dto.getEmail()).isPresent()) {
                throw new RuntimeException("Email already in use");
            }
            customer.setEmail(dto.getEmail());
        }

        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().equals(customer.getPhoneNumber())) {
            if (customerRepository.findByPhoneNumber(dto.getPhoneNumber()).isPresent()) {
                throw new RuntimeException("Phone number already in use");
            }
            customer.setPhoneNumber(dto.getPhoneNumber());
        }

        customer.setFirstName(dto.getFirstName());
        customer.setLastName(dto.getLastName());
        // null-safe update for preferences if needed, or just overwrite
        customer.setPreferences(dto.getPreferences());

        Customer saved = customerRepository.save(customer);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteCustomer(UUID id) {
        if (customerRepository.findById(id).isEmpty()) {
            throw new RuntimeException("Customer not found");
        }
        customerRepository.deleteById(id);
    }

    private CustomerDto mapToDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        dto.setEmail(customer.getEmail());
        dto.setPhoneNumber(customer.getPhoneNumber());
        dto.setPreferences(customer.getPreferences());
        return dto;
    }
}
