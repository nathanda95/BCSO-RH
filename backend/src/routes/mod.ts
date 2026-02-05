import { Router } from "express";
import { requirePerm } from "../middleware/auth";

const router = Router();

router.get("/ping", requirePerm("mod"), (req, res) => {
  res.json({ ok: true, message: "mod pong" });
});

export { router as modRouter };
