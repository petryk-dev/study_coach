-- AlterTable
ALTER TABLE "email_codes" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'verify_email';
