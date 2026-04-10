package com.anotame.sales.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tco_order")
@Getter
@Setter
@SQLDelete(sql = "UPDATE tco_order SET is_deleted = true, deleted_at = NOW() WHERE id_order = ?")
@SQLRestriction("is_deleted = false")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_order")
    private UUID id;

    @Column(name = "ticket_number", unique = true)
    private String ticketNumber;

    @Column(name = "folio_branch", nullable = false)
    private Integer folioBranch;

    @Column(name = "id_branch", nullable = false)
    private UUID branchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_customer", nullable = false)
    private CustomerEntity customer;

    @Column(name = "committed_deadline", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime committedDeadline;

    @Column(nullable = false)
    private String status = "RECEIVED";

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes")
    private String notes;

    @Column(name = "amount_paid", precision = 19, scale = 4)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "total_duration_min")
    private Integer totalDurationMin = 0;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items = new ArrayList<>();

    @Column(name = "created_at", updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt;

    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdBy;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime deletedAt;

    @Column(name = "price_list_id")
    private java.util.UUID priceListId;

    @Column(name = "price_list_name", length = 255)
    private String priceListName;

    @Column(name = "is_deleted")
    private boolean deleted = false;

    // Helper to add items
    public void addItem(OrderItemEntity item) {
        items.add(item);
        item.setOrder(this);
    }
}
