-- CreateTable
CREATE TABLE `verification_runs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NULL,
    `nodeCode` VARCHAR(30) NOT NULL,
    `mode` VARCHAR(20) NOT NULL,
    `result` VARCHAR(20) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NOT NULL,
    `durationMs` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_runs_nodeId_idx`(`nodeId`),
    INDEX `verification_runs_nodeCode_idx`(`nodeCode`),
    INDEX `verification_runs_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `neighbor_readings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `verificationRunId` INTEGER NOT NULL,
    `neighborCode` VARCHAR(30) NULL,
    `mac` VARCHAR(20) NULL,
    `readings` INTEGER NULL,
    `validReadings` INTEGER NULL,
    `discardedReadings` INTEGER NULL,
    `averageRssi` DOUBLE NULL,
    `m15` DOUBLE NULL,
    `minRssi` DOUBLE NULL,
    `maxRssi` DOUBLE NULL,
    `advertising` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `neighbor_readings_verificationRunId_idx`(`verificationRunId`),
    INDEX `neighbor_readings_neighborCode_idx`(`neighborCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verification_runs` ADD CONSTRAINT `verification_runs_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `nodes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `neighbor_readings` ADD CONSTRAINT `neighbor_readings_verificationRunId_fkey` FOREIGN KEY (`verificationRunId`) REFERENCES `verification_runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
