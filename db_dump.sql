/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.4.12-MariaDB, for Linux (x86_64)
--
-- Host: farmu-platform-qa.cluster-cudr5z5cpovz.us-east-1.rds.amazonaws.com    Database: test_api
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('cash','checking','savings','credit_card','usd_cash','usd_savings') NOT NULL DEFAULT 'cash',
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `color` varchar(7) NOT NULL DEFAULT '#1976d2',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES
(2,'BBVA','checking',-7000.00,'#1a73e8','2026-06-01 01:46:13','2026-06-01 01:46:13'),
(3,'Astropay','usd_savings',6074.66,'#00acc1','2026-06-01 01:48:45','2026-06-01 15:24:10'),
(4,'Caja fuerte','cash',1600000.00,'#1a1a1a','2026-06-01 01:53:35','2026-06-01 01:53:57'),
(5,'Caja Fuerte','usd_cash',37000.00,'#1a1a1a','2026-06-01 01:54:30','2026-06-01 01:54:30'),
(6,'Astropay ARS','cash',0.00,'#1a73e8','2026-06-01 15:14:23','2026-06-01 15:23:27');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_expenses`
--

DROP TABLE IF EXISTS `card_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `amount` decimal(12,2) NOT NULL,
  `installments` int NOT NULL DEFAULT '1',
  `category_id` int DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `card_id` (`card_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `card_expenses_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `card_expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_expenses`
--

LOCK TABLES `card_expenses` WRITE;
/*!40000 ALTER TABLE `card_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `card_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_summaries`
--

DROP TABLE IF EXISTS `card_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_summaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int NOT NULL,
  `closing_date` date NOT NULL,
  `due_date` date NOT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `minimum_payment` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `card_id` (`card_id`),
  CONSTRAINT `card_summaries_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_summaries`
--

LOCK TABLES `card_summaries` WRITE;
/*!40000 ALTER TABLE `card_summaries` DISABLE KEYS */;
INSERT INTO `card_summaries` VALUES
(1,1,'2026-05-29','2026-06-05',1400000.00,NULL,'pending',0.00,NULL,'2026-06-01 03:19:43');
/*!40000 ALTER TABLE `card_summaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_cards`
--

DROP TABLE IF EXISTS `credit_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `closing_day` int NOT NULL,
  `due_day` int NOT NULL,
  `credit_limit` decimal(12,2) NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#9c27b0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_cards`
--

LOCK TABLES `credit_cards` WRITE;
/*!40000 ALTER TABLE `credit_cards` DISABLE KEYS */;
INSERT INTO `credit_cards` VALUES
(1,'Visa Black Signature',29,5,24000000.00,'#9c27b0','2026-06-01 03:18:54');
/*!40000 ALTER TABLE `credit_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT 'receipt',
  `color` varchar(7) DEFAULT '#757575',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES
(1,'Alimentación','restaurant','#4caf50'),
(2,'Transporte','directions_car','#ff9800'),
(3,'Servicios','bolt','#f44336'),
(4,'Entretenimiento','movie','#9c27b0'),
(5,'Salud','medical_services','#2196f3'),
(6,'Vivienda','home','#795548'),
(7,'Educación','school','#00bcd4'),
(8,'Ropa','checkroom','#e91e63'),
(9,'Otros','more_horiz','#757575'),
(10,'Alquiler','home','#8d6e63'),
(11,'Tarjeta de crédito','credit_card','#e91e63'),
(12,'Sueldos','payments','#4caf50'),
(13,'ARCA/ARBA','receipt_long','#d32f2f');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `type` enum('daily','weekly','monthly','fixed') NOT NULL DEFAULT 'daily',
  `due_day` int DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES
(11,NULL,13,610000.00,'Monotributo unificado H','fixed',5,NULL,0,'2026-06-01 03:16:51'),
(12,NULL,12,50000.00,'ART + Obra social','fixed',5,NULL,0,'2026-06-01 03:17:21'),
(15,NULL,12,434000.00,'Sueldo Gladys','fixed',5,NULL,0,'2026-06-01 12:57:31'),
(16,NULL,10,1328300.00,'Alquiler casa','fixed',5,NULL,0,'2026-06-01 15:15:30');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_day` int NOT NULL,
  `month_year` varchar(7) NOT NULL,
  `status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
  `partial_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `account_id` int DEFAULT NULL,
  `card_id` int DEFAULT NULL,
  `expense_id` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  KEY `expense_id` (`expense_id`),
  KEY `card_id` (`card_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`card_id`) REFERENCES `credit_cards` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_chk_1` CHECK ((`due_day` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES
(11,'Monotributo unificado H',610000.00,5,'2026-06','pending',0.00,NULL,NULL,11,NULL,'2026-06-01 03:16:51'),
(12,'ART + Obra social',50000.00,5,'2026-06','pending',0.00,NULL,NULL,12,NULL,'2026-06-01 03:17:21'),
(15,'Sueldo Gladys',434000.00,5,'2026-06','paid',434000.00,6,NULL,15,'2026-06-01 15:23:23','2026-06-01 12:57:31'),
(16,'Alquiler casa',1328300.00,5,'2026-06','paid',1328300.00,6,NULL,16,'2026-06-01 15:23:28','2026-06-01 15:15:30'),
(17,'Monotributo unificado H',610000.00,5,'2026-07','pending',0.00,NULL,NULL,11,NULL,'2026-06-01 15:35:47'),
(18,'Monotributo unificado H',610000.00,5,'2026-08','pending',0.00,NULL,NULL,11,NULL,'2026-06-01 15:35:47'),
(19,'Monotributo unificado H',610000.00,5,'2026-09','pending',0.00,NULL,NULL,11,NULL,'2026-06-01 15:35:47'),
(20,'ART + Obra social',50000.00,5,'2026-07','pending',0.00,NULL,NULL,12,NULL,'2026-06-01 15:35:47'),
(21,'ART + Obra social',50000.00,5,'2026-08','pending',0.00,NULL,NULL,12,NULL,'2026-06-01 15:35:47'),
(22,'ART + Obra social',50000.00,5,'2026-09','pending',0.00,NULL,NULL,12,NULL,'2026-06-01 15:35:47'),
(23,'Sueldo Gladys',434000.00,5,'2026-07','pending',0.00,NULL,NULL,15,NULL,'2026-06-01 15:35:47'),
(24,'Sueldo Gladys',434000.00,5,'2026-08','pending',0.00,NULL,NULL,15,NULL,'2026-06-01 15:35:47'),
(25,'Sueldo Gladys',434000.00,5,'2026-09','pending',0.00,NULL,NULL,15,NULL,'2026-06-01 15:35:47'),
(26,'Alquiler casa',1328300.00,5,'2026-07','pending',0.00,NULL,NULL,16,NULL,'2026-06-01 15:35:47'),
(27,'Alquiler casa',1328300.00,5,'2026-08','pending',0.00,NULL,NULL,16,NULL,'2026-06-01 15:35:47'),
(28,'Alquiler casa',1328300.00,5,'2026-09','pending',0.00,NULL,NULL,16,NULL,'2026-06-01 15:35:47');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'astefanov','$2b$10$cFdu25n1klwo7dYGFhSTSOUSIgkXNGqyL2HHPlcvHqX337RA9VLda','Alan Stefanov','2026-05-31 20:57:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-06-02  0:46:51
