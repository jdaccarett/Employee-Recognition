

----------------------
--   USER TABLE
----------------------
  CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `Region` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `img` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE (`email`));
  -- 'signature_img' LONGBLOB NOT NULL,

----------------------
--   AWARDS TABLE
----------------------
CREATE TABLE `awards` (
`award_id` int(11) NOT NULL AUTO_INCREMENT,
`award_type` varchar(255) NOT NULL,
`employee_name` varchar(255) NOT NULL,
`employee_email` varchar(255) NOT NULL,
`timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
`creator_id` int(11) DEFAULT NULL,
FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`),
PRIMARY KEY (`award_id`));

-- AWARDS TABLE DUMMY VALUES
INSERT INTO `awards`(`award_type`, `employee_name`, `employee_email`, `creator_id`)
VALUES ('employee of the month', 'jane doe','janedoe@gmail.com', 1);

INSERT INTO `awards`(`award_type`, `employee_name`, `employee_email`, `creator_id`)
VALUES ('employee of the month', 'katrina heio','katrina@gmail.com', 1);

INSERT INTO `awards`(`award_type`, `employee_name`, `employee_email`, `creator_id`)
VALUES ('employee of the week', 'jacob lol','jacob@gmail.com', 2);

----------------------
--   ADMIN TABLE
----------------------
CREATE TABLE `admin` (
`admin_id` int(11) NOT NULL AUTO_INCREMENT,
`email` varchar(255) NOT NULL,
`timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`admin_id`));
