import { config } from './index';
import type { IceServerConfig } from '@hamster/shared';

/**
 * Get ICE servers configuration for WebRTC
 * Includes Google STUN (free) and TURN (if configured)
 */
export function getIceServers(): IceServerConfig[] {
  const servers: IceServerConfig[] = [
    // Google STUN servers (free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  // Add TURN server if configured (Twilio/Xirsys)
  if (config.turn.url && config.turn.username && config.turn.credential) {
    servers.push({
      urls: config.turn.url,
      username: config.turn.username,
      credential: config.turn.credential,
    });
  }

  return servers;
}
