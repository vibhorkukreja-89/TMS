/**
 * Phase 2 — State Machine Integration Tests
 *
 * Covers all 5 valid transitions (expect HTTP 200) and a representative
 * set of invalid transitions (expect HTTP 422 + INVALID_TRANSITION code).
 *
 * Valid transition map:
 *   OPEN        → IN_PROGRESS, CANCELLED
 *   IN_PROGRESS → RESOLVED, CANCELLED
 *   RESOLVED    → CLOSED
 *   CLOSED      → (none — terminal)
 *   CANCELLED   → (none — terminal)
 */

import supertest from "supertest";
import app from "@/app";
import { prisma } from "@/db";
import type { TicketStatus, Priority } from "@/generated/prisma/client";

const request = supertest(app);

// ─── Test-data helpers ────────────────────────────────────────────────────────

let testUserId: string | null = null;

async function seedUser(): Promise<string> {
  const user = await prisma.user.create({
    data: {
      name: "Test Runner",
      email: `test-runner-${Date.now()}@tms.test`,
      role: "AGENT",
    },
  });
  return user.id;
}

async function createTicketInStatus(status: TicketStatus): Promise<string> {
  if (!testUserId) throw new Error("beforeAll failed — testUserId not set");
  const ticket = await prisma.ticket.create({
    data: {
      title: `[test] transition from ${status}`,
      priority: "MEDIUM" satisfies Priority,
      status,
      createdById: testUserId,
    },
  });
  return ticket.id;
}

async function patchStatus(ticketId: string, newStatus: string) {
  return request
    .patch(`/api/tickets/${ticketId}/status`)
    .send({ status: newStatus })
    .set("Content-Type", "application/json");
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  testUserId = await seedUser();
});

afterAll(async () => {
  if (testUserId) {
    await prisma.ticket.deleteMany({ where: { createdById: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  }
  await prisma.$disconnect();
});

// ─── Valid transitions (all 5 — expect HTTP 200) ─────────────────────────────

describe("Valid transitions → HTTP 200", () => {
  it("OPEN → IN_PROGRESS", async () => {
    const id = await createTicketInStatus("OPEN");
    const res = await patchStatus(id, "IN_PROGRESS");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_PROGRESS");
  });

  it("IN_PROGRESS → RESOLVED", async () => {
    const id = await createTicketInStatus("IN_PROGRESS");
    const res = await patchStatus(id, "RESOLVED");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("RESOLVED");
  });

  it("RESOLVED → CLOSED", async () => {
    const id = await createTicketInStatus("RESOLVED");
    const res = await patchStatus(id, "CLOSED");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CLOSED");
  });

  it("OPEN → CANCELLED", async () => {
    const id = await createTicketInStatus("OPEN");
    const res = await patchStatus(id, "CANCELLED");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
  });

  it("IN_PROGRESS → CANCELLED", async () => {
    const id = await createTicketInStatus("IN_PROGRESS");
    const res = await patchStatus(id, "CANCELLED");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
  });
});

// ─── Invalid transitions (representative set — expect HTTP 422) ───────────────

describe("Invalid transitions → HTTP 422 + INVALID_TRANSITION", () => {
  async function expectRejection(from: TicketStatus, to: string) {
    const id = await createTicketInStatus(from);
    const res = await patchStatus(id, to);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
    expect(res.body.error.message).toMatch(/Cannot transition/i);
  }

  it("OPEN → RESOLVED (skipping IN_PROGRESS)", async () => {
    await expectRejection("OPEN", "RESOLVED");
  });

  it("OPEN → CLOSED (skipping multiple states)", async () => {
    await expectRejection("OPEN", "CLOSED");
  });

  it("IN_PROGRESS → OPEN (backwards)", async () => {
    await expectRejection("IN_PROGRESS", "OPEN");
  });

  it("RESOLVED → IN_PROGRESS (backwards)", async () => {
    await expectRejection("RESOLVED", "IN_PROGRESS");
  });

  it("RESOLVED → OPEN (backwards)", async () => {
    await expectRejection("RESOLVED", "OPEN");
  });

  it("CLOSED → OPEN (terminal state — no exit)", async () => {
    await expectRejection("CLOSED", "OPEN");
  });

  it("CLOSED → IN_PROGRESS (terminal state — no exit)", async () => {
    await expectRejection("CLOSED", "IN_PROGRESS");
  });

  it("CANCELLED → OPEN (terminal state — no exit)", async () => {
    await expectRejection("CANCELLED", "OPEN");
  });

  it("CANCELLED → IN_PROGRESS (terminal state — no exit)", async () => {
    await expectRejection("CANCELLED", "IN_PROGRESS");
  });
});

// ─── Validation error (invalid status value — expect HTTP 400) ───────────────

describe("Validation errors", () => {
  it("Unknown status value → HTTP 400", async () => {
    const id = await createTicketInStatus("OPEN");
    const res = await patchStatus(id, "BOGUS_STATUS");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
