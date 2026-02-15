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

        createGarment("Pants", "Trousers, Jeans, Chinos");
        createGarment("Shirt", "Dress Shirt, T-Shirt, Polo");
        createGarment("Jacket", "Suit Jacket, Blazer, Coat");
        createGarment("Dress", "Casual, Formal");
        createGarment("Skirt", "Mini, Midi, Maxi");
        createGarment("Suit", "2-Piece, 3-Piece");

        System.out.println("Seeded Garment Types");
    }

    private void seedServices() {
        if (serviceRepository.count() > 0)
            return;

        GarmentType pants = garmentTypeRepository.find("name", "Pants").firstResult();
        GarmentType shirt = garmentTypeRepository.find("name", "Shirt").firstResult();
        GarmentType jacket = garmentTypeRepository.find("name", "Jacket").firstResult();
        GarmentType suit = garmentTypeRepository.find("name", "Suit").firstResult();

        // Fallback if not found (should not happen if seeded above)
        if (pants == null)
            return;

        createService("Hemming", "Shorten length", 15, new BigDecimal("12.00"), pants);
        createService("Tapering", "Slim down fit", 30, new BigDecimal("25.00"), pants);
        createService("Zipper Replace", "New zipper install", 45, new BigDecimal("20.00"), jacket);
        createService("Patching", "Repair hole or tear", 20, new BigDecimal("10.00"), pants);
        createService("Button Replace", "Sew on new button", 5, new BigDecimal("2.00"), shirt);
        createService("Dry Clean", "Standard dry cleaning", 1440, new BigDecimal("8.00"), suit);

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
