package com.anotame.identity.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "cca_role")
@Getter
@Setter
// @SQLDelete(sql = "UPDATE cca_role SET is_deleted = true WHERE id_role = ?")
// @SQLRestriction("is_deleted = false")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_role")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_deleted")
    private boolean deleted = false;
}
