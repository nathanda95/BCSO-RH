-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "discord_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "discriminator" TEXT,
    "avatar" TEXT,
    "site_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordMembershipCache" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "guild_id" TEXT NOT NULL,
    "role_ids" TEXT[],
    "synced_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordMembershipCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordTokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discord_id_key" ON "User"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordMembershipCache_user_id_key" ON "DiscordMembershipCache"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordTokens_user_id_key" ON "DiscordTokens"("user_id");

-- AddForeignKey
ALTER TABLE "DiscordMembershipCache" ADD CONSTRAINT "DiscordMembershipCache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordTokens" ADD CONSTRAINT "DiscordTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
