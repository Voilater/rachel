import {
  DEFAULT_INSTAGRAM_SETTINGS,
  sanitizeInstagramSettings,
  type InstagramSettings,
} from "@/lib/instagram-settings";
import { execute, queryOne } from "@/server/db";

const SETTINGS_KEY = "instagram";

type SettingsRow = {
  setting_key: string;
  value_json: string | InstagramSettings;
};

function parseValue(raw: SettingsRow["value_json"]): Partial<InstagramSettings> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw) as Partial<InstagramSettings>;
  } catch {
    return {};
  }
}

export async function readInstagramSettings(): Promise<InstagramSettings> {
  const row = await queryOne<SettingsRow>(
    "SELECT setting_key, value_json FROM site_settings WHERE setting_key = ?",
    [SETTINGS_KEY],
  );
  if (!row) {
    return { ...DEFAULT_INSTAGRAM_SETTINGS, reels: [...DEFAULT_INSTAGRAM_SETTINGS.reels] };
  }
  return sanitizeInstagramSettings(parseValue(row.value_json));
}

export async function writeInstagramSettings(
  input: Partial<InstagramSettings>,
): Promise<InstagramSettings> {
  const next = sanitizeInstagramSettings(input);
  await execute(
    `INSERT INTO site_settings (setting_key, value_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)`,
    [SETTINGS_KEY, JSON.stringify(next)],
  );
  return next;
}
