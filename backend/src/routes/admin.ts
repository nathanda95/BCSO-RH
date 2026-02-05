import { Router } from "express";
import { requirePerm } from "../middleware/auth";

const router = Router();

router.get("/ping", requirePerm("admin"), (req, res) => {
  res.json({ ok: true, message: "admin pong" });
});

export { router as adminRouter };
