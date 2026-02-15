package com.anotame.catalog.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tcc_price_list")
@Getter
@Setter
@SQLDelete(sql = "UPDATE tcc_price_list SET is_deleted = true, deleted_at = NOW() WHERE id_price_list = ?")
// We don't restrict inactive lists by default because we might want to edit
// them, but we WILL filter by active when querying for calculation.
@SQLRestriction("deleted_at IS NULL") // using standard check since is_deleted logic varies
public class PriceList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_price_list")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_to")
    private LocalDateTime validTo;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "priority")
    private Integer priority = 0;

    @OneToMany(mappedBy = "priceList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PriceListItem> items = new ArrayList<>();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDateTime validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDateTime getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDateTime validTo) {
        this.validTo = validTo;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public List<PriceListItem> getItems() {
        return items;
    }

    public void setItems(List<PriceListItem> items) {
        this.items = items;
    }

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Helper to add items
    public void addItem(PriceListItem item) {
        items.add(item);
        item.setPriceList(this);
    }
}
