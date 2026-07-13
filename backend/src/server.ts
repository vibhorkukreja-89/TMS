import "@/config";
import app from "@/app";
import { config } from "@/config";
import { prisma } from "@/db";

async function main(): Promise<void> {
  await prisma.$connect();
  app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
