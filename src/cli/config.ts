import * as fs from 'fs';
import * as path from 'path';

export interface I18nextTypesafeConfig {
  // Generation options
  input?: string;
  output?: string;
  watch?: boolean;

  // Validation options
  locales?: string;
  source?: string;
  languages?: string[];

  // Ignore patterns (supports wildcards with *)
  validation?: {
    ignoreKeys?: string[];
    ignoreBlocks?: string[];
  };
}

const CONFIG_FILE_NAMES = [
  '.i18next-typesafe.json',
  'i18next-typesafe.config.json',
];

/**
 * Load configuration from file
 * @param configPath Optional explicit path to config file
 * @returns Parsed configuration object
 */
export function loadConfig(configPath?: string): I18nextTypesafeConfig {
  const searchPaths = configPath
    ? [configPath]
    : CONFIG_FILE_NAMES.map((name) => path.join(process.cwd(), name));

  for (const filePath of searchPaths) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const config = JSON.parse(content) as I18nextTypesafeConfig;
        return config;
      } catch (error) {
        console.error(`⚠ Error loading config from ${filePath}:`, error);
        return {};
      }
    }
  }

  return {};
}

/**
 * Check if a key matches any of the ignore patterns
 * Supports wildcards with *
 * @param key The key to check
 * @param patterns Array of patterns (e.g., ["legacy.*", "temp.debug"])
 * @returns true if key matches any pattern
 */
export function matchesPattern(key: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }

  return patterns.some((pattern) => {
    // Convert glob pattern to regex
    // Escape special regex characters except *
    const regexPattern =
      '^' +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') +
      '$';
    const regex = new RegExp(regexPattern);
    return regex.test(key);
  });
}

/**
 * Merge CLI options with config file options
 * CLI options take precedence over config file
 */
export function mergeOptions<T extends Record<string, any>>(
  cliOptions: T,
  config: I18nextTypesafeConfig
): T {
  return {
    ...config,
    ...cliOptions,
    // Only override with CLI option if it's explicitly provided (not default value)
  };
}