-- AlterTable
ALTER TABLE `users`
    ADD COLUMN `lastUsedWorkspaceId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `idx_user_last_used_workspace` ON `users`(`lastUsedWorkspaceId`);

-- AddForeignKey
ALTER TABLE `users`
    ADD CONSTRAINT `users_lastUsedWorkspaceId_fkey`
    FOREIGN KEY (`lastUsedWorkspaceId`) REFERENCES `workspaces`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
