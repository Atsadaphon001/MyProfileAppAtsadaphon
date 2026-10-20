-- Run this in phpMyAdmin after selecting database: ip_std6730251387
-- This adds the HR assignment table and preserves existing shop tables/data.

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Both the login form and this database record use admin / admin.
INSERT INTO `users` (`username`, `email`, `password`, `name`, `role`)
VALUES ('admin', 'admin@atsadaphon.local', 'admin', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE
  `password` = 'admin',
  `name` = 'Administrator',
  `role` = 'admin';

CREATE TABLE IF NOT EXISTS Atsadaphon_Employee (
  Atsadaphon_ID_Employ INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  position VARCHAR(150) NOT NULL,
  status ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
  salary DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (Atsadaphon_ID_Employ)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert each sample employee only when that name does not already exist.
INSERT INTO Atsadaphon_Employee (name, position, status, salary)
SELECT 'John Doe', 'Software Engineer', 'Active', 45000
WHERE NOT EXISTS (SELECT 1 FROM Atsadaphon_Employee WHERE name = 'John Doe');

INSERT INTO Atsadaphon_Employee (name, position, status, salary)
SELECT 'Jane Smith', 'HR Manager', 'Active', 52000
WHERE NOT EXISTS (SELECT 1 FROM Atsadaphon_Employee WHERE name = 'Jane Smith');

INSERT INTO Atsadaphon_Employee (name, position, status, salary)
SELECT 'Alex Brown', 'Accountant', 'On Leave', 32000
WHERE NOT EXISTS (SELECT 1 FROM Atsadaphon_Employee WHERE name = 'Alex Brown');

INSERT INTO Atsadaphon_Employee (name, position, status, salary)
SELECT 'Mina Lee', 'UX Designer', 'Active', 38000
WHERE NOT EXISTS (SELECT 1 FROM Atsadaphon_Employee WHERE name = 'Mina Lee');

INSERT INTO Atsadaphon_Employee (name, position, status, salary)
SELECT 'Sam Wilson', 'Sales Executive', 'Active', 27000
WHERE NOT EXISTS (SELECT 1 FROM Atsadaphon_Employee WHERE name = 'Sam Wilson');

-- Verify the created schema and seeded records.
SELECT Atsadaphon_ID_Employ, name, position, status, salary
FROM Atsadaphon_Employee
ORDER BY Atsadaphon_ID_Employ;

SELECT username, password, role FROM users WHERE username = 'admin';
