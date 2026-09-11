-- CreateTable
CREATE TABLE `alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NULL,
    `nodeCode` VARCHAR(30) NOT NULL,
    `verificationRunId` INTEGER NULL,
    `type` VARCHAR(50) NOT NULL,
    `severity` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `title` VARCHAR(150) NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `alerts_nodeId_idx`(`nodeId`),
    INDEX `alerts_nodeCode_idx`(`nodeCode`),
    INDEX `alerts_verificationRunId_idx`(`verificationRunId`),
    INDEX `alerts_type_idx`(`type`),
    INDEX `alerts_status_idx`(`status`),
    INDEX `alerts_openedAt_idx`(`openedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `nodes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_verificationRunId_fkey` FOREIGN KEY (`verificationRunId`) REFERENCES `verification_runs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
