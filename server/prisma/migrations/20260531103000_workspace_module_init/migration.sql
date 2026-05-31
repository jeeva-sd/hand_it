-- CreateTable
CREATE TABLE `workspaces` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `plan` ENUM('FREE', 'PRO', 'TEAM') NOT NULL DEFAULT 'FREE',
    `storageLimitBytes` BIGINT UNSIGNED NOT NULL DEFAULT 2147483648,
    `storageUsedBytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `idx_workspace_created_by`(`createdByUserId`),
    INDEX `idx_workspace_plan`(`plan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workspace_members` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_workspace_member_workspace_user`(`workspaceId`, `userId`),
    INDEX `idx_workspace_member_user`(`userId`),
    INDEX `idx_workspace_member_workspace_role`(`workspaceId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
