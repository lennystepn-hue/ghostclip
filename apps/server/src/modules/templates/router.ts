import { Router, type Router as RouterType } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { replyTemplateSchema } from "@ghostclip/shared";
import * as templateService from "./service";

const router: RouterType = Router();
router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const parsed = replyTemplateSchema.parse(req.body);
    const template = await templateService.createTemplate(req.userId!, parsed);
    res.status(201).json(template);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: "Invalid input", details: error.errors });
    console.error("Create template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const templates = await templateService.getTemplates(req.userId!);
    res.json(templates);
  } catch (error) {
    console.error("List templates error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id as string, req.userId!);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id as string, req.userId!, req.body);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/use", async (req: AuthRequest, res) => {
  try {
    await templateService.incrementUsage(req.params.id as string, req.userId!);
    res.json({ message: "Usage incremented" });
  } catch (error) {
    console.error("Use template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const deleted = await templateService.deleteTemplate(req.params.id as string, req.userId!);
    if (!deleted) return res.status(404).json({ error: "Template not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as templatesRouter };
