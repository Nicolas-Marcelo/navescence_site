-- CreateTable
CREATE TABLE `nodes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `mac` VARCHAR(20) NULL,
    `name` VARCHAR(100) NULL,
    `location` VARCHAR(150) NULL,
    `x` DOUBLE NULL,
    `y` DOUBLE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `maintenance` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nodes_code_key`(`code`),
    UNIQUE INDEX `nodes_mac_key`(`mac`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
