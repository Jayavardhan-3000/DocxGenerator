# Claude Doc Recovery

> Recover Word documents that Claude couldn't finish generating.

When Claude hits its usage limit mid-task, it sometimes leaves behind a JavaScript file using the `docx` npm package — but the actual document was never created. This tool takes that script, patches any Claude-specific sandbox paths, executes it safely, and hands you the finished `.docx` (and optionally a `.pdf`).

---

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Features

- **Drag & drop upload** — `.js` and `.cjs` files
- **Smart script analysis** — detects docx usage, headings, tables, images, estimated pages
- **Automatic path patching** — replaces `/mnt/user-data/outputs/` and other Claude sandbox paths
- **Safe execution** — isolated child process with timeout, captures all logs
- **DOCX generation** — produces the intended Word document
- **PDF conversion** — automatic via LibreOffice (optional, gracefully skipped if unavailable)
- **Rename before download** — change the filename before saving
- **Download all as ZIP** — get DOCX + PDF in one click
- **Recent files** — last 5 successful generations, stored locally
- **Auto cleanup** — temp files deleted after 10 minutes or on download

---

## Requirements

- **Node.js** 18+
- **npm** or **pnpm**
- **LibreOffice** (optional, for PDF conversion)

### Install LibreOffice for PDF support

**macOS:**
```bash
brew install --cask libreoffice
```

**Ubuntu/Debian:**
```bash
apt-get install libreoffice
```

**Without LibreOffice:** The app still works fully — PDF conversion is skipped and you get the DOCX only.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Main page + state orchestration
│   ├── globals.css         # Tailwind + custom CSS
│   └── api/
│       ├── upload/
│       │   └── route.ts    # Upload, analyze, patch, execute, convert
│       ├── download/
│       │   └── route.ts    # Serve DOCX, PDF, or ZIP
│       └── execute/
│           └── route.ts    # Analyze-only endpoint
├── components/
│   ├── DropZone.tsx        # Drag & drop file input
│   ├── AnalysisCard.tsx    # Script structure display
│   ├── ProgressSteps.tsx   # Step-by-step progress UI
│   ├── Terminal.tsx        # Expandable execution log
│   ├── DownloadCenter.tsx  # Download cards + rename
│   ├── RecentFiles.tsx     # Recent generation history
│   └── ErrorCard.tsx       # Error display with retry
└── lib/
    ├── scriptPatcher.ts    # Script analysis + path patching
    ├── scriptExecutor.ts   # Safe Node.js child_process execution
    ├── pdfConverter.ts     # LibreOffice PDF conversion
    ├── cleanup.ts          # Temp file lifecycle management
    ├── types.ts            # Shared TypeScript types
    └── utils.ts            # cn, formatBytes, formatDate
```

---

## Adding More Generators

The architecture is designed to be extended. To add a new generator (e.g. PowerPoint):

1. Create `src/lib/generators/pptxGenerator.ts`
2. Add a new API route at `src/app/api/upload-pptx/route.ts`
3. Reuse `scriptPatcher.ts`, `scriptExecutor.ts`, `cleanup.ts`
4. Add a new tab or toggle in `page.tsx`

The same pattern works for: Excel (.xlsx), HTML, Markdown, LaTeX.

---

## Environment Variables

None required by default. For production deployments, consider:

```env
# Optional: override temp directory
TMPDIR=/var/tmp/cdr

# Optional: execution timeout in ms (default: 30000)
CDR_EXEC_TIMEOUT=30000
```

---

## Security Notes

- Scripts run in a child process, not `eval`
- Each job gets an isolated temp directory
- Temp files are cleaned up after 10 minutes automatically
- No script content is logged or persisted beyond the temp directory
- In production, run behind authentication if exposing publicly

---

## Tech Stack

- **Next.js 15** — App Router, API routes
- **React 18** — Client components with hooks
- **TypeScript** — Full type safety
- **Tailwind CSS** — Dark-first styling
- **Lucide React** — Icons
- **docx** — Word document generation
- **archiver** — ZIP packaging
- **LibreOffice** — PDF conversion (optional system dependency)
