CREATE DATABASE IF NOT EXISTS anotame;
USE anotame;
-- Create Tables
CREATE TABLE Arreglo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(80) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(60) NOT NULL,
    Direccion LONGTEXT,
    Telefono BIGINT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Contraseña VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE Empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Dueño VARCHAR(50) NOT NULL,
    RFC VARCHAR(50) NOT NULL,
    CURP VARCHAR(50) NOT NULL,
    Telefono VARCHAR(20) NOT NULL,
    Direccion VARCHAR(180) NOT NULL,
    Rep_Datos VARCHAR(180) NOT NULL,
    Incorp_Fiscal VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE TipoPrenda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE Prenda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idTipoPrenda INT NOT NULL,
    idArreglo INT NOT NULL,
    Cantidad DECIMAL(19,4) NOT NULL,
    FOREIGN KEY (idTipoPrenda) REFERENCES TipoPrenda(id),
    FOREIGN KEY (idArreglo) REFERENCES Arreglo(id)
) ENGINE=InnoDB;

CREATE TABLE Nota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    FechaEntrega DATETIME NOT NULL,
    FechaRecibido DATETIME NOT NULL,
    idEmpresa INT NOT NULL,
    Folio INT NOT NULL,
    idClientes INT NOT NULL,
    Total DECIMAL(19,4) NOT NULL,
    idEmpleado INT NOT NULL,
    FOREIGN KEY (idEmpresa) REFERENCES Empresa(id),
    FOREIGN KEY (idClientes) REFERENCES Clientes(id),
    FOREIGN KEY (idEmpleado) REFERENCES Empleados(id)
) ENGINE=InnoDB;

CREATE TABLE NotaPrenda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idNota INT,
    idPrenda INT NOT NULL,
    Descripcion LONGTEXT,
    CantidadPrendas INT NOT NULL,
    FOREIGN KEY (idNota) REFERENCES Nota(id),
    FOREIGN KEY (idPrenda) REFERENCES Prenda(id)
) ENGINE=InnoDB;

-- Optional: System diagram table (typically not used in MySQL)
CREATE TABLE sysdiagrams (
    name VARCHAR(128) NOT NULL,
    principal_id INT NOT NULL,
    diagram_id INT AUTO_INCREMENT PRIMARY KEY,
    version INT,
    definition LONGBLOB
) ENGINE=InnoDB;