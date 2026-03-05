import { Router, type Router as RouterType } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { clipCreateSchema } from "@ghostclip/shared";
import * as clipService from "./service";

const router: RouterType = Router();

// All routes require auth
router.use(authMiddleware);

// Create clip
router.post("/", async (req: AuthRequest, res) => {
  try {
    // Check dedup
    const isDuplicate = await clipService.checkDedup(req.userId!, req.body.contentHash);
    if (isDuplicate) {
      return res.status(409).json({ error: "Duplicate clip" });
    }

    const parsed = clipCreateSchema.parse(req.body);
    const clip = await clipService.createClip({
      userId: req.userId!,
      deviceId: req.deviceId!,
      ...parsed,
      actions: parsed.actions,
      aiRaw: parsed.aiRaw ?? null,
      embedding: req.body.embedding,
    });
    res.status(201).json(clip);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Create clip error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List clips with filtering
router.get("/", async (req: AuthRequest, res) => {
  try {
    const result = await clipService.getClips(req.userId!, {
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
      type: req.query.type as string,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      pinned: req.query.pinned === "true" ? true : req.query.pinned === "false" ? false : undefined,
      archived: req.query.archived === "true" ? true : req.query.archived === "false" ? false : undefined,
      search: req.query.search as string,
      deviceId: req.query.deviceId as string,
    });
    res.json(result);
  } catch (error) {
    console.error("List clips error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get clip stats
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const stats = await clipService.getClipStats(req.userId!);
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check dedup
router.get("/dedup/:hash", async (req: AuthRequest, res) => {
  try {
    const exists = await clipService.checkDedup(req.userId!, req.params.hash as string);
    res.json({ exists });
  } catch (error) {
    console.error("Dedup check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Semantic search
router.post("/search", async (req: AuthRequest, res) => {
  try {
    const { embedding, limit } = req.body;
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: "Embedding vector required" });
    }
    const results = await clipService.semanticSearch(req.userId!, embedding, limit || 10);
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single clip
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const clip = await clipService.getClipById(req.params.id as string, req.userId!);
    if (!clip) return res.status(404).json({ error: "Clip not found" });
    res.json(clip);
  } catch (error) {
    console.error("Get clip error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update clip (pin, archive, tags)
router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const clip = await clipService.updateClip(req.params.id as string, req.userId!, req.body);
    if (!clip) return res.status(404).json({ error: "Clip not found" });
    res.json(clip);
  } catch (error) {
    console.error("Update clip error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete clip
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const deleted = await clipService.deleteClip(req.params.id as string, req.userId!);
    if (!deleted) return res.status(404).json({ error: "Clip not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Delete clip error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as clipboardRouter };
