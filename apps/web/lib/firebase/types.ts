/**
 * XPeX Academy × Firebase Fabric Foundation — Types
 * MISSION: XPEX-FIREBASE-FABRIC-FOUNDATION-001
 * 
 * Central contracts for the Firebase Fabric layer surrounding XPeX Core.
 * Non-destructive, multi-tenant aware, zero-secret, SSR-safe.
 */

/** Public web configuration (identifiers only, zero secrets) */
export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

/** Truthful service lifecycle state */
export type FirebaseServiceStatus =
  | 'configured'
  | 'available'
  | 'disabled'
  | 'unsupported'
  | 'degraded'
  | 'not_initialized'

/** Overall status of the Firebase Fabric foundation */
export interface FirebaseFabricStatus {
  ready: boolean
  environment: string
  projectId: string
  services: {
    app: FirebaseServiceStatus
    analytics: FirebaseServiceStatus
    appCheck: FirebaseServiceStatus
    remoteConfig: FirebaseServiceStatus
    performance: FirebaseServiceStatus
    messaging: FirebaseServiceStatus
    aiLogic: FirebaseServiceStatus
  }
}

/** Staged App Check modes */
export type AppCheckMode = 'disabled' | 'observe' | 'enforce'

/** Feature flag keys defined by XPeX Remote Config taxonomy */
export type XpexFeatureFlagKey =
  | 'xara_enabled'
  | 'xara_rag_enabled'
  | 'pulse_enabled'
  | 'pulse_live_sources_enabled'
  | 'pulse_youtube_api_enabled'
  | 'pulse_news_enabled'
  | 'pulse_trends_enabled'
  | 'pulse_xara_enabled'
  | 'pulse_personalization_enabled'
  | 'pulse_cache_enabled'
  | 'pulse_creator_feed_enabled'
  | 'pulse_tech_feed_enabled'
  | 'pulse_radar_enabled'
  | 'pulse_search_enabled'
  | 'toolhub_enabled'
  | 'project_vault_enabled'
  | 'vision_studio_enabled'
  | 'soundlab_enabled'
  | 'launchpad_enabled'
  | 'community_enabled'
  | 'certificates_enabled'
  | 'maintenance_mode'
  | 'beta_features'
  | 'xara_model'
  | 'ff_gxeon_command_center_enabled'
  | 'ff_xara_copilot_enabled'
  | 'ff_app_check_enforcement'
  | 'ff_push_notifications_enabled'
  | 'ff_ai_logic_enabled'

/** Default fallback values for feature flags (code-authoritative) */
export const XPEX_FEATURE_FLAG_DEFAULTS: Record<XpexFeatureFlagKey, boolean | string | number> = {
  xara_enabled: true,
  xara_rag_enabled: true,
  pulse_enabled: true,
  pulse_live_sources_enabled: false,
  pulse_youtube_api_enabled: false,
  pulse_news_enabled: true,
  pulse_trends_enabled: true,
  pulse_xara_enabled: true,
  pulse_personalization_enabled: false,
  pulse_cache_enabled: true,
  pulse_creator_feed_enabled: false,
  pulse_tech_feed_enabled: true,
  pulse_radar_enabled: true,
  pulse_search_enabled: true,
  toolhub_enabled: false,
  project_vault_enabled: false,
  vision_studio_enabled: false,
  soundlab_enabled: false,
  launchpad_enabled: false,
  community_enabled: true,
  certificates_enabled: true,
  maintenance_mode: false,
  beta_features: false,
  xara_model: 'server-managed',
  ff_gxeon_command_center_enabled: true,
  ff_xara_copilot_enabled: true,
  ff_app_check_enforcement: false,
  ff_push_notifications_enabled: false,
  ff_ai_logic_enabled: false,
}

/** Canonical XPeX event taxonomy (Section 8) */
export type XpexEventName =
  // Auth & Student Lifecycle
  | 'student_login'
  | 'tenant_selected'
  | 'profile_updated'
  | 'student_shell_loaded'
  // Learning Flow
  | 'course_started'
  | 'course_opened'
  | 'lesson_started'
  | 'lesson_completed'
  | 'activity_started'
  | 'activity_submitted'
  | 'trail_started'
  | 'certificate_earned'
  // XARA AI Copilot
  | 'xara_opened'
  | 'xara_question_sent'
  | 'xara_response_completed'
  | 'xara_grounded_response'
  | 'xara_source_opened'
  // Pulse
  | 'pulse_opened'
  | 'pulse_search'
  | 'pulse_filter_selected'
  | 'pulse_content_started'
  | 'pulse_content_completed'
  | 'pulse_content_saved'
  | 'pulse_source_opened'
  | 'pulse_xara_opened'
  | 'pulse_xara_action'
  | 'pulse_topic_followed'
  | 'pulse_source_loaded'
  | 'pulse_video_selected'
  | 'pulse_news_opened'
  | 'pulse_technology_opened'
  | 'pulse_creator_opened'
  | 'pulse_search_result_selected'
  // Projects & Studios
  | 'project_created'
  | 'vision_job_started'
  | 'sound_project_created'
  | 'vault_asset_saved'
  // Launchpad & Portfolio
  | 'launchpad_opened'
  | 'opportunity_opened'
  | 'portfolio_shared'

/** Safe tenant context properties for telemetry */
export interface SafeTenantContext {
  tenant_id?: string
  tenant_type?: string
  user_role?: string
}

export type NotificationPermissionState = 'default' | 'denied' | 'granted' | 'unsupported'

/** Messaging capability probe */
export interface MessagingCapability {
  supported: boolean
  permissionState: NotificationPermissionState
  serviceWorkerReady: boolean
}
