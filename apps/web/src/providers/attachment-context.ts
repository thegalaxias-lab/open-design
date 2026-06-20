import type { ChatAttachment, ChatMessage } from '../types';
import {
  fetchProjectFilePreview,
  fetchProjectFileText,
  type ProjectFilePreview,
} from './registry';

const MAX_TOTAL_CONTEXT_CHARS = 30_000;
const MAX_PER_ATTACHMENT_CHARS = 12_000;

interface AttachmentLoaders {
  preview: (projectId: string, path: string) => Promise<ProjectFilePreview | null>;
  text: (projectId: string, path: string) => Promise<string | null>;
}

const defaultLoaders: AttachmentLoaders = {
  preview: fetchProjectFilePreview,
  text: fetchProjectFileText,
};

export async function withApiAttachmentContext(
  projectId: string,
  history: ChatMessage[],
  attachments: ChatAttachment[],
  loaders: AttachmentLoaders = defaultLoaders,
): Promise<ChatMessage[]> {
  if (attachments.length === 0 || history.length === 0) return history;
  const context = await buildApiAttachmentContext(projectId, attachments, loaders);
  if (!context) return history;
  const next = [...history];
  const last = next[next.length - 1]!;
  next[next.length - 1] = {
    ...last,
    content: `${last.content.trim()}\n\n${context}`,
  };
  return next;
}

export async function buildApiAttachmentContext(
  projectId: string,
  attachments: ChatAttachment[],
  loaders: AttachmentLoaders = defaultLoaders,
): Promise<string> {
  if (attachments.length === 0) return '';

  const blocks: string[] = [];
  let used = 0;

  for (const attachment of attachments) {
    const block = await buildSingleAttachmentBlock(projectId, attachment, loaders);
    if (!block) continue;
    const remaining = MAX_TOTAL_CONTEXT_CHARS - used;
    if (remaining <= 0) break;
    const trimmed = truncate(block, remaining);
    blocks.push(trimmed);
    used += trimmed.length;
  }

  if (blocks.length === 0) return '';
  return [
    '<attached-file-context>',
    'The user attached these project files. Use the extracted text below as source material for this turn.',
    ...blocks,
    '</attached-file-context>',
  ].join('\n');
}

async function buildSingleAttachmentBlock(
  projectId: string,
  attachment: ChatAttachment,
  loaders: AttachmentLoaders,
): Promise<string> {
  const label = attachment.name || attachment.path;
  const header = `\n## Attached file: ${label}\nPath: ${attachment.path}`;
  const path = attachment.path;

  if (isPreviewableDocument(path)) {
    const preview = await loaders.preview(projectId, path);
    if (preview) {
      const body = preview.sections
        .map((section) => {
          const title = section.title ? `### ${section.title}\n` : '';
          return `${title}${section.lines.join('\n')}`;
        })
        .join('\n\n')
        .trim();
      return `${header}\nExtracted ${preview.kind} text:\n${truncate(body || '(No readable text found.)', MAX_PER_ATTACHMENT_CHARS)}`;
    }
  }

  if (isTextLike(path)) {
    const text = await loaders.text(projectId, path);
    if (text != null) {
      return `${header}\nFile text:\n${truncate(text, MAX_PER_ATTACHMENT_CHARS)}`;
    }
  }

  return [
    header,
    'No text preview was available. This API provider cannot directly read binary project files; ask the user for text if this file is essential.',
  ].join('\n');
}

function isPreviewableDocument(path: string): boolean {
  return /\.(pdf|docx?|pptx|xlsx)$/i.test(path);
}

function isTextLike(path: string): boolean {
  return /\.(txt|md|markdown|csv|tsv|json|html?|css|js|jsx|ts|tsx|xml|svg|yml|yaml)$/i.test(path);
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 80)).trimEnd()}\n\n[Attachment context truncated.]`;
}
