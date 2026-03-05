import { Router, type Router as RouterType } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { aiLimiter } from "../../middleware/rate-limit";
import * as aiService from "./service";

const router: RouterType = Router();

router.use(authMiddleware);
router.use(aiLimiter);

// Enrich clip content
router.post("/enrich", async (req: AuthRequest, res) => {
  try {
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: "type and content required" });
    }
    const result = await aiService.enrichClipContent({
      type,
      content,
      userId: req.userId!,
    });
    res.json(result);
  } catch (error) {
    console.error("AI enrich error:", error);
    res.status(500).json({ error: "AI enrichment failed" });
  }
});

// Generate reply suggestions
router.post("/replies", async (req: AuthRequest, res) => {
  try {
    const { message, template } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message required" });
    }
    const result = await aiService.getReplySuggestions({
      message,
      userId: req.userId!,
      template,
    });
    res.json(result);
  } catch (error) {
    console.error("AI replies error:", error);
    res.status(500).json({ error: "Reply generation failed" });
  }
});

// Chat with clipboard history
router.post("/chat", async (req: AuthRequest, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message required" });
    }
    const result = await aiService.chatWithClips({
      message,
      userId: req.userId!,
      conversationHistory: conversationHistory || [],
    });
    res.json({ response: result });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Analyze image
router.post("/vision", async (req: AuthRequest, res) => {
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: "imageBase64 and mediaType required" });
    }
    const result = await aiService.analyzeClipImage({ imageBase64, mediaType });
    res.json(result);
  } catch (error) {
    console.error("AI vision error:", error);
    res.status(500).json({ error: "Image analysis failed" });
  }
});

export { router as aiRouter };
