import * as fs from 'fs';
import * as path from 'path';

interface GenerateOptions {
  input: string;
  output: string;
  watch?: boolean;
}

function flattenKeys(
  obj: Record<string, any>,
  prefix = ''
): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function generateTypeFile(keys: string[], outputPath: string): void {
  const keyCount = keys.length;
  const sortedKeys = [...keys].sort();

  const typeUnion = sortedKeys.map((key) => `  | '${key}'`).join('\n');

  const content = `// AUTO-GENERATED - DO NOT EDIT
// Generated from translation files
// Total keys: ${keyCount}

export type TranslationKey =
${typeUnion};
`;

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Generated ${keyCount} translation keys to ${outputPath}`);
}

export async function generate(options: GenerateOptions): Promise<void> {
  const { input, output, watch = false } = options;

  const processFile = () => {
    try {
      if (!fs.existsSync(input)) {
        console.error(`Error: Input file not found: ${input}`);
        process.exit(1);
      }

      const fileContent = fs.readFileSync(input, 'utf-8');
      const translations = JSON.parse(fileContent);

      const keys = flattenKeys(translations);
      generateTypeFile(keys, output);
    } catch (error) {
      console.error('Error generating types:', error);
      if (!watch) {
        process.exit(1);
      }
    }
  };

  processFile();

  if (watch) {
    console.log(`\nWatching ${input} for changes...`);
    fs.watchFile(input, { interval: 1000 }, () => {
      console.log('\nFile changed, regenerating types...');
      processFile();
    });
  }
}
