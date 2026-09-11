-- AlterTable
ALTER TABLE `nodes` ADD COLUMN `environmentId` INTEGER NULL;

-- CreateTable
CREATE TABLE `environments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(40) NULL,
    `floor` VARCHAR(40) NOT NULL DEFAULT 'Térreo',
    `description` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `environments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `nodes_environmentId_idx` ON `nodes`(`environmentId`);

-- AddForeignKey
ALTER TABLE `nodes` ADD CONSTRAINT `nodes_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
