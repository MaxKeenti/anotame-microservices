import com.anotame.operations.application.port.output.WorkOrderRepositoryPort;
import com.anotame.operations.domain.model.WorkOrder;
import com.anotame.operations.domain.model.WorkOrderItem;
import com.anotame.operations.infrastructure.persistence.entity.WorkOrderItemJpa;
import com.anotame.operations.infrastructure.persistence.entity.WorkOrderJpa;
import com.anotame.operations.infrastructure.persistence.repository.WorkOrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
@RequiredArgsConstructor
public class WorkOrderPersistenceAdapter implements WorkOrderRepositoryPort {

    private final WorkOrderRepository workOrderRepository;

    @Override
    @Transactional
    public WorkOrder save(WorkOrder workOrder) {
        if (workOrder == null) {
            return null;
        }
        WorkOrderJpa entity = toJpa(workOrder);
        if (entity == null) {
            return null;
        }

        if (entity.getId() == null) {
            workOrderRepository.persist(entity);
        } else {
            // If entity already has ID, it might be managed or detached.
            // If it matches existing row, persist might throw if detached or if duplicate
            // ID.
            // Panache doesn't have explicit update() besides just setting fields on managed
            // entity.
            // But if we reconstruct Jpa entity from Domain, it's detached.
            // We must merge. PanacheRepository.getEntityManager().merge(entity)
            workOrderRepository.getEntityManager().merge(entity);
        }

        return toDomain(entity);
    }

    @Override
    public Optional<WorkOrder> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return workOrderRepository.findByIdOptional(id).map(this::toDomain);
    }

    @Override
    public Optional<WorkOrder> findBySalesOrderId(UUID salesOrderId) {
        if (salesOrderId == null) {
            return Optional.empty();
        }
        return workOrderRepository.findBySalesOrderId(salesOrderId).map(this::toDomain);
    }

    @Override
    public java.util.List<WorkOrder> findAll() {
        return workOrderRepository.listAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (id != null) {
            workOrderRepository.deleteById(id);
        }
    }

    // Mappers
    private WorkOrderJpa toJpa(WorkOrder domain) {
        WorkOrderJpa entity = new WorkOrderJpa();
        entity.setId(domain.getId());
        entity.setSalesOrderId(domain.getSalesOrderId());
        entity.setStatus(domain.getStatus());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());

        if (domain.getItems() != null) {
            entity.setItems(domain.getItems().stream().map(item -> {
                WorkOrderItemJpa itemJpa = new WorkOrderItemJpa();
                itemJpa.setId(item.getId());
                itemJpa.setSalesOrderItemId(item.getSalesOrderItemId());
                itemJpa.setServiceName(item.getServiceName());
                itemJpa.setCurrentStage(item.getCurrentStage());
                itemJpa.setNotes(item.getNotes());
                itemJpa.setWorkOrder(entity);
                return itemJpa;
            }).collect(Collectors.toList()));
        }
        return entity;
    }

    private WorkOrder toDomain(WorkOrderJpa entity) {
        WorkOrder domain = new WorkOrder();
        domain.setId(entity.getId());
        domain.setSalesOrderId(entity.getSalesOrderId());
        domain.setStatus(entity.getStatus());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getItems() != null) {
            domain.setItems(entity.getItems().stream().map(itemJpa -> {
                WorkOrderItem item = new WorkOrderItem();
                item.setId(itemJpa.getId());
                item.setSalesOrderItemId(itemJpa.getSalesOrderItemId());
                item.setServiceName(itemJpa.getServiceName());
                item.setCurrentStage(itemJpa.getCurrentStage());
                item.setNotes(itemJpa.getNotes());
                return item;
            }).collect(Collectors.toList()));
        }
        return domain;
    }
}
