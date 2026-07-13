import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log("Seeding database...");

  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const [alice, bob, carol] = await Promise.all([
    prisma.user.create({
      data: { name: "Alice Nguyen", email: "alice@example.com", role: "ADMIN" },
    }),
    prisma.user.create({
      data: { name: "Bob Patel", email: "bob@example.com", role: "AGENT" },
    }),
    prisma.user.create({
      data: { name: "Carol Smith", email: "carol@example.com", role: "AGENT" },
    }),
  ]);

  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        title: "Login page crashes on Safari",
        description: "Users on Safari 17+ get a blank screen after submitting credentials.",
        priority: "CRITICAL",
        status: "OPEN",
        createdById: alice.id,
        assignedToId: bob.id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Export to CSV missing date filter",
        description: "The date range filter is ignored when exporting to CSV.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        createdById: bob.id,
        assignedToId: carol.id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Update footer copyright year",
        description: "Footer still shows 2023.",
        priority: "LOW",
        status: "RESOLVED",
        createdById: carol.id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Email notifications not sending",
        description: "Users report they stopped receiving email alerts after the last deploy.",
        priority: "HIGH",
        status: "OPEN",
        createdById: alice.id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Dashboard loads slowly on mobile",
        description: "Initial load time exceeds 8s on 4G connections.",
        priority: "MEDIUM",
        status: "OPEN",
        createdById: bob.id,
        assignedToId: alice.id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Typo in onboarding email",
        description: "Step 3 reads 'clcik' instead of 'click'.",
        priority: "LOW",
        status: "CANCELLED",
        createdById: carol.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.comment.create({
      data: {
        message: "Reproduced on Safari 17.4. Likely a CORS preflight issue.",
        ticketId: tickets[0]!.id,
        createdById: bob.id,
      },
    }),
    prisma.comment.create({
      data: {
        message: "Checking auth headers — will update by EOD.",
        ticketId: tickets[0]!.id,
        createdById: alice.id,
      },
    }),
    prisma.comment.create({
      data: {
        message: "Confirmed the query ignores `startDate` param. Fix in progress.",
        ticketId: tickets[1]!.id,
        createdById: carol.id,
      },
    }),
    prisma.comment.create({
      data: {
        message: "Fixed in PR #42. Deploying to staging.",
        ticketId: tickets[2]!.id,
        createdById: carol.id,
      },
    }),
    prisma.comment.create({
      data: {
        message: "SMTP config looks fine. Might be the queue processor — investigating.",
        ticketId: tickets[3]!.id,
        createdById: alice.id,
      },
    }),
  ]);

  console.log(`Seeded: 3 users, ${tickets.length} tickets, 5 comments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
