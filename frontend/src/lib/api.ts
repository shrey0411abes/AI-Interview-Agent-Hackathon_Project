import { Candidate } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface SSEPayload {
  type?: 'phase' | 'token' | 'metadata';
  stage?: string;
  label?: string;
  provider?: string;
  token?: string;
  done?: boolean;
  reply?: string;
  feedback?: any;
  currentQuestionIndex?: number;
  daysProbedCount?: number;
  currentDay?: number;
  currentDayTitle?: string;
  isFollowup?: boolean;
}

export async function sendInterviewTurnStream(
  sessionId: string,
  options: {
    message?: string;
    candidate?: Candidate;
    requestId?: string;
    onPhase?: (phase: SSEPayload) => void;
    onToken: (token: string) => void;
    onComplete: (data: SSEPayload) => void;
    onError: (err: any) => void;
  }
) {
  try {
    const payload = {
      sessionId,
      ...(options.candidate ? { candidate: options.candidate } : {}),
      ...(options.message ? { message: options.message } : {}),
      ...(options.requestId ? { requestId: options.requestId } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/api/interview?stream=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'Server error'}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const rawData = trimmed.replace('data: ', '').trim();
          if (rawData === '[DONE]') {
            continue;
          }
          try {
            const parsed: SSEPayload = JSON.parse(rawData);
            if (parsed.type === 'phase' && options.onPhase) {
              options.onPhase(parsed);
            }
            if (parsed.token) {
              options.onToken(parsed.token);
            }
            if (parsed.type === 'metadata' || (parsed.reply !== undefined && !parsed.token)) {
              options.onComplete(parsed);
            }
          } catch (e) {
            console.error('Failed to parse SSE payload line:', rawData, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('SSE Stream Error:', error);
    options.onError(error);
  }
}
