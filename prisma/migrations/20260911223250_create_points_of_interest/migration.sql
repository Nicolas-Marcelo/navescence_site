-- CreateTable
CREATE TABLE `points_of_interest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `nodeId` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `points_of_interest_code_key`(`code`),
    INDEX `points_of_interest_nodeId_idx`(`nodeId`),
    INDEX `points_of_interest_type_idx`(`type`),
    INDEX `points_of_interest_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `points_of_interest` ADD CONSTRAINT `points_of_interest_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `nodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
