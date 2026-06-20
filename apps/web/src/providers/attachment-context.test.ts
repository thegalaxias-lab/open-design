import { describe, expect, it } from 'vitest';
import {
  buildApiAttachmentContext,
  withApiAttachmentContext,
} from './attachment-context';
import type { ChatAttachment, ChatMessage } from '../types';

describe('API attachment context', () => {
  it('injects PDF preview text into the last user message', async () => {
    const history: ChatMessage[] = [
      { id: 'u1', role: 'user', content: '이 PDF로 슬라이드를 만들어줘.' },
    ];
    const attachments: ChatAttachment[] = [
      { path: 'guide.pdf', name: 'guide.pdf', kind: 'file' },
    ];

    const next = await withApiAttachmentContext('p1', history, attachments, {
      preview: async () => ({
        kind: 'pdf',
        title: 'guide.pdf',
        sections: [{ title: 'PDF', lines: ['수시 전형 요약', '학생부종합 안내'] }],
      }),
      text: async () => null,
    });

    expect(next[0]!.content).toContain('<attached-file-context>');
    expect(next[0]!.content).toContain('Attached file: guide.pdf');
    expect(next[0]!.content).toContain('수시 전형 요약');
    expect(history[0]!.content).toBe('이 PDF로 슬라이드를 만들어줘.');
  });

  it('falls back to raw text for text-like attachments', async () => {
    const context = await buildApiAttachmentContext(
      'p1',
      [{ path: 'brief.md', name: 'brief.md', kind: 'file' }],
      {
        preview: async () => null,
        text: async () => '# 브리프\n핵심 문장',
      },
    );

    expect(context).toContain('File text:');
    expect(context).toContain('핵심 문장');
  });
});
