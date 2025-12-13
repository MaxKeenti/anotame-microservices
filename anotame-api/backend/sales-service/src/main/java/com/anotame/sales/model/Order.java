package com.anotame.sales.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tco_order")
@Getter
@Setter
@SQLDelete(sql = "UPDATE tco_order SET is_deleted = true, deleted_at = NOW() WHERE id_order = ?")
@SQLRestriction("is_deleted = false")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_order")
    private UUID id;

    // Generated human-readable ticket number (e.g. ORD-1024)
    // For now, we manually set it or use a sequence in DB.
    // We'll treating as nullable for now or generate in Service.
    @Column(name = "ticket_number", unique = true)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_customer", nullable = false)
    private Customer customer;

    @Column(name = "committed_deadline")
    private LocalDateTime committedDeadline;

    @Column(nullable = false)
    private String status = "RECEIVED"; // RECEIVED, IN_PROGRESS, READY, DELIVERED, CANCELLED

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes")
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by") // User ID from Auth Context
    private UUID createdBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_deleted")
    private boolean deleted = false;

    // Helper to add items
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
