/*
  Warnings:

  - A unique constraint covering the columns `[path]` on the table `Node` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "path" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Node_slug_parentId_idx" ON "Node"("slug", "parentId");

-- CreateIndex
CREATE INDEX "Node_path_idx" ON "Node"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Node_path_key" ON "Node"("path");
