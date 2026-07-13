import express from "express";
import cors from "cors";
import ticketRouter from "@/routes/ticket.router";
import commentRouter from "@/routes/comment.router";
import userRouter from "@/routes/user.router";
import { errorHandler } from "@/middleware/error-handler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/tickets/:id/comments", commentRouter);

app.use(errorHandler);

export default app;
