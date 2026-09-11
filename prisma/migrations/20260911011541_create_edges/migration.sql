-- CreateTable
CREATE TABLE `edges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeAId` INTEGER NOT NULL,
    `nodeBId` INTEGER NOT NULL,
    `distance` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `edges_nodeAId_idx`(`nodeAId`),
    INDEX `edges_nodeBId_idx`(`nodeBId`),
    UNIQUE INDEX `edges_nodeAId_nodeBId_key`(`nodeAId`, `nodeBId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `edges` ADD CONSTRAINT `edges_nodeAId_fkey` FOREIGN KEY (`nodeAId`) REFERENCES `nodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `edges` ADD CONSTRAINT `edges_nodeBId_fkey` FOREIGN KEY (`nodeBId`) REFERENCES `nodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
