CREATE TABLE `siteStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalVisitors` int NOT NULL DEFAULT 0,
	`totalPageViews` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteStats_id` PRIMARY KEY(`id`)
);
