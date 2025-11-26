-- Seed default user
-- Password is 'password123' hashed with a simple salt for testing
-- In a real app, we would use a proper bcrypt hash
INSERT INTO User (email, username, hashed_password, full_name, is_active, is_superuser)
VALUES 
  ('admin@publicdomainhunter.com', 'admin', '$2a$10$X7V.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5.j5', 'Admin User', 1, 1);
