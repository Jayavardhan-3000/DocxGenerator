import * as os from "os";
import * as path from "path";

export interface ScriptAnalysis {
  usesDocx: boolean;
  hasPacker: boolean;
  outputFile: string | null;
  outputDir: string | null;
  claudePath: string | null;
  headings: number;
  tables: number;
  images: number;
  codeBlocks: number;
  paragraphs: number;
  estimatedPages: number;
  isValid: boolean;
  errors: string[];
}

export function analyzeScript(code: string): ScriptAnalysis {
  const errors: string[] = [];

  const usesDocx =
    /require\s*\(\s*['"]docx['"]\s*\)|from\s+['"]docx['"]/i.test(code);
  const hasPacker = /Packer\s*\./i.test(code);

  if (!usesDocx) errors.push("No 'docx' library import found");
  if (!hasPacker) errors.push("No Packer usage found — document may not be saved");

  // Detect output filename
  const fileMatches = [
    ...code.matchAll(/['"]([^'"]*?([A-Za-z0-9_\-. ]+\.docx))['"]/gi),
  ];
  let outputFile: string | null = null;
  let outputDir: string | null = null;
  let claudePath: string | null = null;

  if (fileMatches.length > 0) {
    const fullPath = fileMatches[0][1];
    outputFile = fileMatches[0][2] || path.basename(fullPath);
    outputDir = path.dirname(fullPath);
    if (
      /\/mnt\/user-data|\/tmp\/sandbox|\/home\/sandbox|\/outputs\//i.test(
        fullPath
      )
    ) {
      claudePath = fullPath;
    }
  }

  const headings = (code.match(/HeadingLevel\.|new\s+Heading\b/gi) || []).length;
  const tables = (code.match(/new\s+Table\b/gi) || []).length;
  const images = (code.match(/new\s+ImageRun\b/gi) || []).length;
  const codeBlocks = (code.match(/font.*Courier|CodeBlock|monospace/gi) || []).length;
  const paragraphs = (code.match(/new\s+Paragraph\b/gi) || []).length;
  const estimatedPages = Math.max(1, Math.ceil(paragraphs / 8));

  return {
    usesDocx,
    hasPacker,
    outputFile,
    outputDir,
    claudePath,
    headings,
    tables,
    images,
    codeBlocks,
    paragraphs,
    estimatedPages,
    isValid: usesDocx && hasPacker && errors.length === 0,
    errors,
  };
}

export function patchScript(code: string, outputDir: string): string {
  let patched = code;

  // Replace Claude sandbox paths
  patched = patched.replace(
    /['"]\/mnt\/user-data\/outputs\/([^'"]*)['"]/gi,
    `"${outputDir}/$1"`
  );
  patched = patched.replace(
    /['"]\/tmp\/[^'"]*?\/([^'"\/]+\.docx)['"]/gi,
    `"${outputDir}/$1"`
  );
  patched = patched.replace(
    /['"]\/home\/[^'"]*?\/([^'"\/]+\.docx)['"]/gi,
    `"${outputDir}/$1"`
  );
  patched = patched.replace(
    /['"]\/root\/[^'"]*?\/([^'"\/]+\.docx)['"]/gi,
    `"${outputDir}/$1"`
  );
  patched = patched.replace(
    /['"]\/outputs\/([^'"]*)['"]/gi,
    `"${outputDir}/$1"`
  );

  // If no path replacement happened but there's a .docx filename without a path,
  // leave it as-is (will write to cwd which we'll set to outputDir)

  return patched;
}

export function getTempDir(): string {
  return os.tmpdir();
}
