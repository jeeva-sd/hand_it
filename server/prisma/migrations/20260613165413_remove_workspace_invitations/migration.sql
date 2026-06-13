/*
  Warnings:

  - You are about to drop the `workspace_invitations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `workspace_invitations` DROP FOREIGN KEY `workspace_invitations_inviterId_fkey`;

-- DropForeignKey
ALTER TABLE `workspace_invitations` DROP FOREIGN KEY `workspace_invitations_workspaceId_fkey`;

-- DropTable
DROP TABLE `workspace_invitations`;
