import { describe, expect, it } from 'vitest';
import { isNearChatBottom, shouldScrollChatToBottom } from './chat-scroll';

describe('chat scroll behavior', () => {
  it('scrolls to the bottom when a new message is appended', () => {
    expect(
      shouldScrollChatToBottom({
        previousLastMessageId: 'assistant-1',
        nextLastMessageId: 'assistant-2',
        wasPinnedToBottom: false,
      }),
    ).toBe(true);
  });

  it('keeps following streamed text only while the user is near the bottom', () => {
    expect(
      shouldScrollChatToBottom({
        previousLastMessageId: 'assistant-1',
        nextLastMessageId: 'assistant-1',
        wasPinnedToBottom: true,
      }),
    ).toBe(true);
    expect(
      shouldScrollChatToBottom({
        previousLastMessageId: 'assistant-1',
        nextLastMessageId: 'assistant-1',
        wasPinnedToBottom: false,
      }),
    ).toBe(false);
  });

  it('treats the chat as pinned when the viewport is close to the bottom', () => {
    expect(isNearChatBottom({ scrollHeight: 1000, scrollTop: 760, clientHeight: 200 })).toBe(true);
    expect(isNearChatBottom({ scrollHeight: 1000, scrollTop: 650, clientHeight: 200 })).toBe(false);
  });
});
