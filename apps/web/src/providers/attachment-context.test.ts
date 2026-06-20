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

  it('keeps earlier attached files available on follow-up API turns', async () => {
    const history: ChatMessage[] = [
      {
        id: 'u1',
        role: 'user',
        content: '가천대 입시요강으로 10장 슬라이드를 만들어줘.',
        attachments: [{ path: 'guide.pdf', name: '2027-susi-guide.pdf', kind: 'file' }],
      },
      {
        id: 'a1',
        role: 'assistant',
        content: '입시요강 파일이 있나요?',
      },
      {
        id: 'u2',
        role: 'user',
        content: '첨부했는데?',
      },
    ];

    const next = await withApiAttachmentContext('p1', history, [], {
      preview: async () => ({
        kind: 'pdf',
        title: 'guide.pdf',
        sections: [{ title: 'PDF', lines: ['가천대학교 입학전형 안내'] }],
      }),
      text: async () => null,
    });

    expect(next[2]!.content).toContain('<attached-file-context>');
    expect(next[2]!.content).toContain('2027-susi-guide.pdf');
    expect(next[2]!.content).toContain('가천대학교 입학전형 안내');
  });

  it('keeps later PDF text from long admissions guides', async () => {
    const longIntro = '학교 소개 '.repeat(3000);
    const context = await buildApiAttachmentContext(
      'p1',
      [{ path: 'guide.pdf', name: 'guide.pdf', kind: 'file' }],
      {
        preview: async () => ({
          kind: 'pdf',
          title: 'guide.pdf',
          sections: [
            {
              title: 'PDF',
              lines: [longIntro, '수시모집 학생부종합 전형 세부 안내'],
            },
          ],
        }),
        text: async () => null,
      },
    );

    expect(context).toContain('수시모집 학생부종합 전형 세부 안내');
  });
});
