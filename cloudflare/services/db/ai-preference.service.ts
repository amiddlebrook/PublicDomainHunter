// cloudflare/services/db/ai-preference.service.ts
// AI Preference database service layer for Cloudflare D1

import { D1Database } from '@cloudflare/workers-types';

export interface AIPreference {
    id: number;
    user_id: number;
    enabled_providers: string[]; // Parsed from JSON
    default_provider: string | null;
    mix_providers: boolean;
    provider_settings: Record<string, any>; // Parsed from JSON
    temperature: number;
    max_tokens: number;
    api_keys: Record<string, string>; // User's own API keys (encrypted)
    setup_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface AIPreferenceRow {
    id: number;
    user_id: number;
    enabled_providers: string; // JSON string
    default_provider: string | null;
    mix_providers: number; // 0 or 1
    provider_settings: string; // JSON string
    temperature: number;
    max_tokens: number;
    api_keys: string | null; // JSON string (encrypted)
    setup_completed: number; // 0 or 1
    created_at: string;
    updated_at: string;
}

export interface UpdateAIPreferenceInput {
    enabled_providers?: string[];
    default_provider?: string | null;
    mix_providers?: boolean;
    provider_settings?: Record<string, any>;
    temperature?: number;
    max_tokens?: number;
    api_keys?: Record<string, string>;
    setup_completed?: boolean;
}

// Supported API key providers
export const API_KEY_PROVIDERS = ['openai', 'claude', 'gemini', 'openrouter'] as const;
export type ApiKeyProvider = typeof API_KEY_PROVIDERS[number];

export class AIPreferenceService {
    constructor(private db: D1Database) { }

    /**
     * Get preferences for a user. Creates default preferences if they don't exist.
     */
    async getPreferences(userId: number): Promise<AIPreference> {
        const row = await this.db.prepare('SELECT * FROM AIPreference WHERE user_id = ?')
            .bind(userId)
            .first<AIPreferenceRow>();

        if (!row) {
            return this.createDefaultPreferences(userId);
        }

        return this.mapRowToPreference(row);
    }

    /**
     * Create default preferences for a user
     */
    private async createDefaultPreferences(userId: number): Promise<AIPreference> {
        const defaultProviders: string[] = [];
        const defaultSettings = {};
        const defaultApiKeys = {};

        const result = await this.db.prepare(`
      INSERT INTO AIPreference (
        user_id,
        enabled_providers,
        default_provider,
        mix_providers,
        provider_settings,
        temperature,
        max_tokens,
        api_keys,
        setup_completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
            userId,
            JSON.stringify(defaultProviders),
            null, // No default until user sets up keys
            0, // false
            JSON.stringify(defaultSettings),
            0.7,
            4000,
            JSON.stringify(defaultApiKeys),
            0 // setup not completed
        ).first<AIPreferenceRow>();

        if (!result) {
            throw new Error('Failed to create default AI preferences');
        }

        return this.mapRowToPreference(result);
    }

    /**
     * Update preferences for a user
     */
    async updatePreferences(userId: number, input: UpdateAIPreferenceInput): Promise<AIPreference> {
        // First ensure preferences exist
        await this.getPreferences(userId);

        const updates: string[] = [];
        const values: any[] = [];

        if (input.enabled_providers !== undefined) {
            updates.push('enabled_providers = ?');
            values.push(JSON.stringify(input.enabled_providers));
        }
        if (input.default_provider !== undefined) {
            updates.push('default_provider = ?');
            values.push(input.default_provider);
        }
        if (input.mix_providers !== undefined) {
            updates.push('mix_providers = ?');
            values.push(input.mix_providers ? 1 : 0);
        }
        if (input.provider_settings !== undefined) {
            updates.push('provider_settings = ?');
            values.push(JSON.stringify(input.provider_settings));
        }
        if (input.temperature !== undefined) {
            updates.push('temperature = ?');
            values.push(input.temperature);
        }
        if (input.max_tokens !== undefined) {
            updates.push('max_tokens = ?');
            values.push(input.max_tokens);
        }
        if (input.api_keys !== undefined) {
            updates.push('api_keys = ?');
            values.push(JSON.stringify(input.api_keys));
        }
        if (input.setup_completed !== undefined) {
            updates.push('setup_completed = ?');
            values.push(input.setup_completed ? 1 : 0);
        }

        if (updates.length === 0) {
            return this.getPreferences(userId);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        const sql = `UPDATE AIPreference SET ${updates.join(', ')} WHERE user_id = ? RETURNING *`;

        const result = await this.db.prepare(sql).bind(...values).first<AIPreferenceRow>();

        if (!result) {
            throw new Error('Failed to update AI preferences');
        }

        return this.mapRowToPreference(result);
    }

    /**
     * Helper to map database row to typed object
     */
    private mapRowToPreference(row: AIPreferenceRow): AIPreference {
        return {
            id: row.id,
            user_id: row.user_id,
            enabled_providers: JSON.parse(row.enabled_providers || '[]'),
            default_provider: row.default_provider,
            mix_providers: Boolean(row.mix_providers),
            provider_settings: JSON.parse(row.provider_settings || '{}'),
            temperature: row.temperature,
            max_tokens: row.max_tokens,
            api_keys: JSON.parse(row.api_keys || '{}'),
            setup_completed: Boolean(row.setup_completed),
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    /**
     * Get setup status for a user - used for gating functionality
     */
    async getSetupStatus(userId: number): Promise<{ setupCompleted: boolean; configuredProviders: string[] }> {
        const prefs = await this.getPreferences(userId);
        const configuredProviders = Object.keys(prefs.api_keys).filter(key => prefs.api_keys[key]);
        return {
            setupCompleted: prefs.setup_completed,
            configuredProviders
        };
    }

    /**
     * Save API keys for a user and mark setup as completed
     */
    async saveApiKeys(userId: number, apiKeys: Record<string, string>): Promise<AIPreference> {
        // Filter out empty keys
        const validKeys: Record<string, string> = {};
        for (const [provider, key] of Object.entries(apiKeys)) {
            if (key && key.trim()) {
                validKeys[provider] = key.trim();
            }
        }

        // Determine enabled providers based on which keys are set
        const enabledProviders = Object.keys(validKeys);
        const defaultProvider = enabledProviders.length > 0 ? enabledProviders[0] : null;

        return this.updatePreferences(userId, {
            api_keys: validKeys,
            enabled_providers: enabledProviders,
            default_provider: defaultProvider,
            setup_completed: enabledProviders.length > 0
        });
    }

    /**
     * Get API key for a specific provider (for use by LLM service)
     */
    async getApiKey(userId: number, provider: string): Promise<string | null> {
        const prefs = await this.getPreferences(userId);
        return prefs.api_keys[provider] || null;
    }

    /**
     * Check if user has any API keys configured
     */
    async hasApiKeys(userId: number): Promise<boolean> {
        const prefs = await this.getPreferences(userId);
        return Object.keys(prefs.api_keys).length > 0;
    }
}
