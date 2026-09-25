/**
 * XPeX Academy × Firebase Fabric Foundation — AI Logic Adapter (Dormant)
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Future adapter contract for Firebase Genkit / AI Logic integration.
 * CANONICAL ARCHITECTURE: Existing GXEON / FastAPI / LearnHouse RAG gateway remains canonical.
 * This adapter is INACTIVE by default and feature-flagged.
 */

import type { FirebaseServiceStatus } from './types'
import { isFeatureEnabled } from './feature-flags'

/**
 * Returns current status of Firebase AI Logic.
 * In Mission 001, remains inactive/dormant by design.
 */
export function getAILogicStatus(): FirebaseServiceStatus {
  // Check if future flag is toggled (defaults to false)
  const isEnabled = isFeatureEnabled('ff_ai_logic_enabled')
  return isEnabled ? 'configured' : 'disabled'
}

/**
 * Architectural interface for future AI Logic integration.
 * In Mission 001, GXEON gateway handles all live streaming and completions.
 */
export interface FutureAILogicAdapter {
  isAvailable(): boolean
  promptStream?(_prompt: string, _context?: Record<string, unknown>): AsyncIterable<string>
}

/**
 * Dormant provider reference.
 */
export const GXEON_AI_GATEWAY_CONTRACT = {
  canonicalGateway: '/xpex/ai-gateway',
  directClientGemini: false,
} as const

