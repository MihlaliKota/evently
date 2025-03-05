-- MySQL dump 10.13  Distrib 9.2.0, for Win64 (x86_64)
--
-- Host: localhost    Database: evently_db
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `eventcategories`
--

DROP TABLE IF EXISTS `eventcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventcategories` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventcategories`
--

LOCK TABLES `eventcategories` WRITE;
/*!40000 ALTER TABLE `eventcategories` DISABLE KEYS */;
INSERT INTO `eventcategories` VALUES (1,'Technology',NULL,'2025-02-26 09:44:58','2025-02-26 09:44:58'),(2,'Art',NULL,'2025-02-26 09:45:18','2025-02-26 09:45:18'),(3,'Music',NULL,'2025-02-26 09:45:31','2025-02-26 09:45:31'),(4,'Food',NULL,'2025-02-26 09:45:46','2025-02-26 09:45:46'),(5,'Sports',NULL,'2025-02-26 09:46:08','2025-02-26 09:46:08');
/*!40000 ALTER TABLE `eventcategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `event_date` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `event_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_id` int unsigned NOT NULL,
  PRIMARY KEY (`event_id`),
  KEY `user_id` (`user_id`),
  KEY `fk_events_categories` (`category_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_events_categories` FOREIGN KEY (`category_id`) REFERENCES `eventcategories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,1,'Annual Tech Conference 2025','Join us for the largest tech conference of the year in 2025! Speakers, workshops, and networking opportunities.','2025-03-15 09:00:00','Convention Center, New York',NULL,'2025-02-26 10:10:18','2025-02-26 10:10:18',1),(2,1,'Modern Art Exhibition Opening 2025','Experience the opening night of the \'Visions of Tomorrow 2025\' art exhibition. Meet talented artists and immerse yourself in contemporary masterpieces.','2025-03-22 18:00:00','City Art Gallery, London',NULL,'2025-02-26 10:16:56','2025-02-26 10:16:56',2),(3,1,'Indie Rock Live Concert 2025','Get ready for an unforgettable night of indie rock music with headliners \'The Pioneers\' and rising stars \'Electric Dreams\' in 2025.','2025-03-29 20:30:00','Music Hall, Berlin',NULL,'2025-02-26 10:17:07','2025-02-26 10:17:07',3),(4,1,'International Food Festival 2025','Embark on a culinary journey around the world in 2025 at our International Food Festival! Taste exquisite dishes from over 30 countries, enjoy live cooking demonstrations, and family-friendly fun.','2025-04-05 11:00:00','Central Park, Paris',NULL,'2025-02-26 10:17:19','2025-02-26 10:17:19',4),(5,1,'Professional Basketball Game 2025','Experience the thrill of professional basketball as the \'City Eagles\' clash with the \'Downtown Sharks\' in a highly anticipated match in 2025.','2025-04-12 19:00:00','Sports Arena, Chicago',NULL,'2025-02-26 10:17:37','2025-02-26 10:17:37',5),(6,1,'Future of Tech Summit 2024','A retrospective look at the Future of Tech Summit held in October 2024. Discussions on AI, Blockchain, and more.','2024-10-12 09:00:00','Tech Convention Center, San Francisco',NULL,'2025-02-28 09:21:06','2025-02-28 09:21:06',1),(7,1,'Rock Legends Reunion Concert - 2024','A throwback to the amazing Rock Legends Reunion concert from August 2024 featuring iconic rock bands.','2024-08-25 19:30:00','Stadium Arena, London',NULL,'2025-02-28 09:25:29','2025-02-28 09:25:29',3),(8,1,'Championship Basketball Finals - 2024','Relive the excitement of the Championship Basketball Finals game from June 2024.','2024-06-15 17:00:00','National Sports Center, Chicago',NULL,'2025-02-28 09:25:40','2025-02-28 09:25:40',4),(9,1,'Summer Flavors Food Festival 2024','A delicious memory of the Summer Flavors Food Festival held in July 2024, showcasing diverse cuisines.','2024-07-04 12:00:00','Downtown Festival Park, New York',NULL,'2025-02-28 09:25:51','2025-02-28 09:25:51',5),(10,1,'Abstract Visions Art Show - 2024','Remember the Abstract Visions art exhibition that showcased modern abstract art in September 2024.','2024-09-18 11:00:00','Modern Art Gallery, Paris',NULL,'2025-02-28 09:28:13','2025-02-28 09:28:13',2);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int unsigned NOT NULL,
  `review_text` text,
  `rating` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `registration_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) DEFAULT NULL,
  `bio` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Mihlali','Mihlali@example.com','$2b$10$tTaUdJgmEJsyjYWSVgdbdu.BRQyHkRwpU2A5NvxF5IswpcQ0C1B8K','2025-02-26 11:35:32',NULL,'Peas','2025-02-26 09:35:32','2025-03-03 12:19:16','user'),(2,'Mihle','Mihle@example.com','$2b$10$56.QlziuOxhUGeqhjMI2i.8iuj8RK24WNf6rEgu7rP0y5C4rBguo6','2025-02-26 12:22:04',NULL,'Chilled guy.','2025-02-26 10:22:04','2025-02-28 08:01:08','user'),(3,'Bukho','Bukho@example.com','$2b$10$Qobu77Z1J9znXaD/bQyXTOn97Y2PZAPGH.lwLMa7OJlR5ocxNa/kK','2025-02-27 10:37:18',NULL,NULL,'2025-02-27 08:37:18','2025-02-27 08:37:18','user'),(4,'admin_user','admin@example.com','$2b$10$ju.xfbn5sAHWgYRvYxvqiuAlx.81S0yr/bjvgTV1M4mTGYabiajUC','2025-03-03 16:13:52',NULL,NULL,'2025-03-03 14:13:52','2025-03-03 14:13:52','admin'),(5,'Sihle','sihle@gmail.com','$2b$10$L4oCg5jxGEXzen61IqJLf.MaGom.7c/C245.Kebt3vG2fZnASB8oK','2025-03-03 17:07:07',NULL,NULL,'2025-03-03 15:07:07','2025-03-03 15:07:07','admin'),(6,'Boa','boa@gmail.com','$2b$10$yvR3RiHWRt6b5Semqld6C.FVOu1V0BD/DREg13iH2TBFJbEYBbWuG','2025-03-03 17:08:01',NULL,NULL,'2025-03-03 15:08:01','2025-03-03 15:08:01','user');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-04 16:57:35
