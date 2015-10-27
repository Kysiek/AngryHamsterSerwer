-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema AngryHamsterDb
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `AngryHamsterDb` ;

-- -----------------------------------------------------
-- Schema AngryHamsterDb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `AngryHamsterDb` DEFAULT CHARACTER SET utf8 ;
USE `AngryHamsterDb` ;

-- -----------------------------------------------------
-- Table `AngryHamsterDb`.`currency`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `AngryHamsterDb`.`currency` ;

CREATE TABLE IF NOT EXISTS `AngryHamsterDb`.`currency` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `currency` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `AngryHamsterDb`.`exchangerate`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `AngryHamsterDb`.`exchangerate` ;

CREATE TABLE IF NOT EXISTS `AngryHamsterDb`.`exchangerate` (
  `id` INT(11) NOT NULL,
  `fromCurrencyId` INT(11) NOT NULL,
  `toCurrencyId` INT(11) NOT NULL,
  `rate` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fromCurrency_currency_FK`
    FOREIGN KEY (`fromCurrencyId`)
    REFERENCES `AngryHamsterDb`.`currency` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `toCurrency_currency_fk`
    FOREIGN KEY (`toCurrencyId`)
    REFERENCES `AngryHamsterDb`.`currency` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE INDEX `fromCurrency_currency_FK_idx` ON `AngryHamsterDb`.`exchangerate` (`fromCurrencyId` ASC);

CREATE INDEX `toCurrency_currency_fk_idx` ON `AngryHamsterDb`.`exchangerate` (`toCurrencyId` ASC);


-- -----------------------------------------------------
-- Table `AngryHamsterDb`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `AngryHamsterDb`.`users` ;

CREATE TABLE IF NOT EXISTS `AngryHamsterDb`.`users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `hashedPassword` VARCHAR(255) NOT NULL,
  `status` VARCHAR(45) NOT NULL,
  `authenticationToken` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE UNIQUE INDEX `Nick_UNIQUE` ON `AngryHamsterDb`.`users` (`username` ASC);


-- -----------------------------------------------------
-- Table `AngryHamsterDb`.`wallet`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `AngryHamsterDb`.`wallet` ;

CREATE TABLE IF NOT EXISTS `AngryHamsterDb`.`wallet` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `userId` INT(11) NOT NULL,
  `currencyId` INT(11) NOT NULL,
  `amount` DOUBLE NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Pockets_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `AngryHamsterDb`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Wallet_Currency`
    FOREIGN KEY (`currencyId`)
    REFERENCES `AngryHamsterDb`.`currency` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE INDEX `fk_Pockets_Users_idx` ON `AngryHamsterDb`.`wallet` (`userId` ASC);

CREATE INDEX `fk_Wallet_Currency_idx` ON `AngryHamsterDb`.`wallet` (`currencyId` ASC);


-- -----------------------------------------------------
-- Table `AngryHamsterDb`.`transactions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `AngryHamsterDb`.`transactions` ;

CREATE TABLE IF NOT EXISTS `AngryHamsterDb`.`transactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `walletId` INT(11) NOT NULL,
  `toWalletId` INT(11) NULL DEFAULT NULL,
  `exchangeRateId` INT(11) NOT NULL,
  `originalAmount` DECIMAL(38,20) NULL,
  `amount` DECIMAL(38,20) NULL DEFAULT NULL,
  `transactionType` VARCHAR(20) NULL DEFAULT NULL,
  `description` VARCHAR(50) NULL DEFAULT NULL,
  `date` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Transactions_ExchangeRate1`
    FOREIGN KEY (`exchangeRateId`)
    REFERENCES `AngryHamsterDb`.`exchangerate` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Transactions_Pockets1`
    FOREIGN KEY (`walletId`)
    REFERENCES `AngryHamsterDb`.`wallet` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_fromWalet_walet`
    FOREIGN KEY (`toWalletId`)
    REFERENCES `AngryHamsterDb`.`wallet` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE INDEX `fk_Transactions_Pockets1_idx` ON `AngryHamsterDb`.`transactions` (`walletId` ASC);

CREATE INDEX `fk_Transactions_ExchangeRate1_idx` ON `AngryHamsterDb`.`transactions` (`exchangeRateId` ASC);

CREATE INDEX `fk_fromWalet_walet_idx` ON `AngryHamsterDb`.`transactions` (`toWalletId` ASC);


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `AngryHamsterDb`.`currency`
-- -----------------------------------------------------
START TRANSACTION;
USE `AngryHamsterDb`;
INSERT INTO `AngryHamsterDb`.`currency` (`id`, `currency`) VALUES (1, 'BitCoin');
INSERT INTO `AngryHamsterDb`.`currency` (`id`, `currency`) VALUES (2, 'EUR');
INSERT INTO `AngryHamsterDb`.`currency` (`id`, `currency`) VALUES (3, 'LiteCoin');

COMMIT;

