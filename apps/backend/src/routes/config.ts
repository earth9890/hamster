import { Router, Request, Response } from 'express';
import { getIceServers } from '../config/turn';

const router = Router();

// Public WebRTC configuration (no auth required)
router.get('/webrtc', (_req: Request, res: Response) => {
  res.json({ iceServers: getIceServers() });
});

// Public feature configuration
router.get('/features', (_req: Request, res: Response) => {
  res.json({
    maxVideoDuration: 7200, // 2 hours
    maxMessageLength: 500,
    supportedCountries: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP', 'BR', 'IN'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'hi'],
  });
});

export default router;
