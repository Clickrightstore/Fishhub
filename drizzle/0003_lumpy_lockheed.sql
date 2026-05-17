CREATE TABLE `manualPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50) NOT NULL DEFAULT 'bank_transfer',
	`transactionReference` varchar(255),
	`notes` text,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manualPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`accountHolder` varchar(255) NOT NULL,
	`accountNumber` varchar(50) NOT NULL,
	`branchCode` varchar(50),
	`reference` varchar(255) NOT NULL,
	`instructions` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentConfig_id` PRIMARY KEY(`id`)
);
