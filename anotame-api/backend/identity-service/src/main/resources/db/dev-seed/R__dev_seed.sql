-- Repeatable dev seed: idempotent admin user + ADMIN role
-- Flyway re-runs this whenever the file content changes.

INSERT INTO cca_role (id_role, code, name, description)
VALUES ('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Administrador', 'Full system access')
ON CONFLICT (id_role) DO NOTHING;

INSERT INTO tca_user (id_user, id_role, username, email, password_hash, first_name, last_name, locale)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    'admin@anotame.com',
    -- bcrypt $2a$ hash of 'admin123'
    crypt('admin123', gen_salt('bf', 10)),
    'Admin',
    'User',
    'es'
)
ON CONFLICT (id_user) DO UPDATE SET
    password_hash = crypt('admin123', gen_salt('bf', 10));
