-- CreateTable
CREATE TABLE `workspace_invitations` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
    `inviterId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_workspace_invite_token_hash`(`tokenHash`),
    INDEX `idx_workspace_invite_email`(`email`),
    INDEX `idx_workspace_invite_workspace`(`workspaceId`),
    INDEX `idx_workspace_invite_inviter`(`inviterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workspace_invitations` ADD CONSTRAINT `workspace_invitations_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspace_invitations` ADD CONSTRAINT `workspace_invitations_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
