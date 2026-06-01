CREATE DATABASE IF NOT EXISTS simple_finance;
USE simple_finance;

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('cash', 'checking', 'savings', 'credit_card', 'usd_cash', 'usd_savings') NOT NULL DEFAULT 'cash',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  color VARCHAR(7) NOT NULL DEFAULT '#1976d2',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'receipt',
  color VARCHAR(7) DEFAULT '#757575'
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT,
  category_id INT,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  type ENUM('daily', 'weekly', 'monthly', 'fixed') NOT NULL DEFAULT 'daily',
  due_day INT DEFAULT NULL,
  expense_date DATE DEFAULT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 5),
  month_year VARCHAR(7) NOT NULL,
  status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
  partial_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  account_id INT,
  expense_id INT DEFAULT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS credit_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  closing_day INT NOT NULL,
  due_day INT NOT NULL,
  credit_limit DECIMAL(12,2) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#9c27b0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  amount DECIMAL(12,2) NOT NULL,
  installments INT NOT NULL DEFAULT 1,
  category_id INT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES credit_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS card_summaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  closing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  minimum_payment DECIMAL(12,2),
  status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES credit_cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (username, password, name) VALUES
('astefanov', '$2b$10$cFdu25n1klwo7dYGFhSTSOUSIgkXNGqyL2HHPlcvHqX337RA9VLda', 'Alan Stefanov');

INSERT IGNORE INTO expense_categories (id, name, icon, color) VALUES
(1, 'Alimentación', 'restaurant', '#4caf50'),
(2, 'Transporte', 'directions_car', '#ff9800'),
(3, 'Servicios', 'bolt', '#f44336'),
(4, 'Entretenimiento', 'movie', '#9c27b0'),
(5, 'Salud', 'medical_services', '#2196f3'),
(6, 'Vivienda', 'home', '#795548'),
(7, 'Educación', 'school', '#00bcd4'),
(8, 'Ropa', 'checkroom', '#e91e63'),
(9, 'Otros', 'more_horiz', '#757575');
