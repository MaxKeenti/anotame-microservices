package com.anotame.catalog.infrastructure.persistence;

import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.repository.GarmentTypeRepository;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;

@ApplicationScoped
public class DataSeeder {

    private final GarmentTypeRepository garmentTypeRepository;
    private final ServiceRepository serviceRepository;

    public DataSeeder(GarmentTypeRepository garmentTypeRepository, ServiceRepository serviceRepository) {
        this.garmentTypeRepository = garmentTypeRepository;
        this.serviceRepository = serviceRepository;
    }

    @Transactional
    public void onStart(@Observes StartupEvent ev) {
        seedGarments();
        seedServices();
    }

    private void seedGarments() {
        if (garmentTypeRepository.count() > 0)
            return;

        createGarment("Pantalón", "Pantalones de vestir, Jeans, Chinos");
        createGarment("Camisa", "Camisa de vestir, Playera, Polo");
        createGarment("Chamarra", "Saco, Blazer, Abrigo");
        createGarment("Vestido", "Casual, Formal");
        createGarment("Falda", "Mini, Midi, Maxi");
        createGarment("Traje", "2 Piezas, 3 Piezas");

        System.out.println("Seeded Garment Types");
    }

    private void seedServices() {
        if (serviceRepository.count() > 0)
            return;

        GarmentType pantalon = garmentTypeRepository.find("name", "Pantalón").firstResult();
        GarmentType camisa = garmentTypeRepository.find("name", "Camisa").firstResult();
        GarmentType chamarra = garmentTypeRepository.find("name", "Chamarra").firstResult();
        GarmentType traje = garmentTypeRepository.find("name", "Traje").firstResult();

        if (pantalon == null)
            return;

        createService("Bastilla", "Acortar largo de prenda", 15, new BigDecimal("12.00"), pantalon);
        createService("Entallado", "Ajustar para un corte más delgado", 30, new BigDecimal("25.00"), pantalon);
        createService("Cambio de Cierre", "Instalación de cierre nuevo", 45, new BigDecimal("20.00"), chamarra);
        createService("Parche", "Reparar agujero o rasgadura", 20, new BigDecimal("10.00"), pantalon);
        createService("Cambio de Botón", "Coser botón nuevo", 5, new BigDecimal("2.00"), camisa);
        createService("Lavado en Seco", "Lavado en seco estándar", 1440, new BigDecimal("8.00"), traje);

        System.out.println("Seeded Services");
    }

    private void createGarment(String name, String desc) {
        GarmentType g = new GarmentType();
        g.setName(name);
        g.setDescription(desc);
        g.setActive(true);
        garmentTypeRepository.persist(g);
    }

    private void createService(String name, String desc, int duration, BigDecimal price,
            GarmentType garmentType) {
        Service s = new Service();
        s.setName(name);
        s.setDescription(desc);
        s.setDefaultDurationMin(duration);
        s.setBasePrice(price);
        s.setActive(true);
        s.setGarmentType(garmentType);
        serviceRepository.persist(s);
    }
}
