const DEFAULT_BOTTOM_THRESHOLD_PX = 120;

export interface ChatScrollPosition {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}

export interface ChatScrollDecision {
  previousLastMessageId: string | null;
  nextLastMessageId: string | null;
  wasPinnedToBottom: boolean;
}

export function isNearChatBottom(
  position: ChatScrollPosition,
  thresholdPx = DEFAULT_BOTTOM_THRESHOLD_PX,
): boolean {
  const distance = position.scrollHeight - position.scrollTop - position.clientHeight;
  return distance <= thresholdPx;
}

export function shouldScrollChatToBottom({
  previousLastMessageId,
  nextLastMessageId,
  wasPinnedToBottom,
}: ChatScrollDecision): boolean {
  return nextLastMessageId !== previousLastMessageId || wasPinnedToBottom;
}
