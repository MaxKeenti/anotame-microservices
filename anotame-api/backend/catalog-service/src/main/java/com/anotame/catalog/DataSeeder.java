package com.anotame.catalog;

import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.repository.GarmentTypeRepository;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final GarmentTypeRepository garmentTypeRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public void run(String... args) throws Exception {
        seedGarments();
        seedServices();
    }

    private void seedGarments() {
        if (garmentTypeRepository.count() > 0)
            return;

        createGarment("PANTS", "Pants", "Trousers, Jeans, Chinos");
        createGarment("SHIRT", "Shirt", "Dress Shirt, T-Shirt, Polo");
        createGarment("JACKET", "Jacket", "Suit Jacket, Blazer, Coat");
        createGarment("DRESS", "Dress", "Casual, Formal");
        createGarment("SKIRT", "Skirt", "Mini, Midi, Maxi");
        createGarment("SUIT", "Suit", "2-Piece, 3-Piece");

        System.out.println("Seeded Garment Types");
    }

    private void seedServices() {
        if (serviceRepository.count() > 0)
            return;

        createService("HEM", "Hemming", "Shorten length", 15, new BigDecimal("12.00"));
        createService("TAPER", "Tapering", "Slim down fit", 30, new BigDecimal("25.00"));
        createService("ZIPPER", "Zipper Replace", "New zipper install", 45, new BigDecimal("20.00"));
        createService("PATCH", "Patching", "Repair hole or tear", 20, new BigDecimal("10.00"));
        createService("BUTTON", "Button Replace", "Sew on new button", 5, new BigDecimal("2.00"));
        createService("DRY_CLEAN", "Dry Clean", "Standard dry cleaning", 1440, new BigDecimal("8.00"));

        System.out.println("Seeded Services");
    }

    private void createGarment(String code, String name, String desc) {
        GarmentType g = new GarmentType();
        g.setCode(code);
        g.setName(name);
        g.setDescription(desc);
        g.setActive(true);
        garmentTypeRepository.save(g);
    }

    private void createService(String code, String name, String desc, int duration, BigDecimal price) {
        Service s = new Service();
        s.setCode(code);
        s.setName(name);
        s.setDescription(desc);
        s.setDefaultDurationMin(duration);
        s.setBasePrice(price);
        s.setActive(true);
        serviceRepository.save(s);
    }
}
