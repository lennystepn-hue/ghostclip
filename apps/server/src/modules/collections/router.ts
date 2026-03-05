import { Router, type Router as RouterType } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { collectionCreateSchema } from "@ghostclip/shared";
import * as collectionService from "./service";

const router: RouterType = Router();
router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const parsed = collectionCreateSchema.parse(req.body);
    const collection = await collectionService.createCollection(req.userId!, parsed);
    res.status(201).json(collection);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: "Invalid input", details: error.errors });
    console.error("Create collection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const collections = await collectionService.getCollections(req.userId!);
    res.json(collections);
  } catch (error) {
    console.error("List collections error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const collection = await collectionService.getCollectionById(req.params.id as string, req.userId!);
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    console.error("Get collection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const collection = await collectionService.updateCollection(req.params.id as string, req.userId!, req.body);
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    console.error("Update collection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/clips/:clipId", async (req: AuthRequest, res) => {
  try {
    const collection = await collectionService.addClipToCollection(req.params.id as string, req.userId!, req.params.clipId as string);
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    console.error("Add clip to collection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/clips/:clipId", async (req: AuthRequest, res) => {
  try {
    const collection = await collectionService.removeClipFromCollection(req.params.id as string, req.userId!, req.params.clipId as string);
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    console.error("Remove clip from collection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const deleted = await collectionService.deleteCollection(req.params.id as string, req.userId!);
    if (!deleted) return res.status(404).json({ error: "Collection not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Delete collection error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as collectionsRouter };
