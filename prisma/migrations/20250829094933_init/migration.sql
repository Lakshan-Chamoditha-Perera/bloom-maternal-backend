-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('MOTHER', 'CLINIC_USER') NOT NULL DEFAULT 'MOTHER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `firstName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_role_idx`(`email`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mother` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dob` DATE NOT NULL,
    `nicNumber` VARCHAR(20) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Mother_userId_key`(`userId`),
    UNIQUE INDEX `Mother_nicNumber_key`(`nicNumber`),
    INDEX `Mother_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicalRecord` (
    `id` VARCHAR(191) NOT NULL,
    `bloodPressure` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `sugarLevel` DOUBLE NULL,
    `gestationalAge` INTEGER NULL,
    `notes` TEXT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `motherId` VARCHAR(191) NOT NULL,

    INDEX `MedicalRecord_motherId_idx`(`motherId`),
    INDEX `MedicalRecord_recordedAt_idx`(`recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Mother` ADD CONSTRAINT `Mother_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicalRecord` ADD CONSTRAINT `MedicalRecord_motherId_fkey` FOREIGN KEY (`motherId`) REFERENCES `Mother`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
