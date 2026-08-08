import { useCallback } from 'react';
import { useInterviewStore } from '../lib/store';
import { sendInterviewTurnStream } from '../lib/api';

export function useInterviewStream() {
  const {
    sessionId,
    selectedCandidate,
    isStreaming,
    addMessage,
    startStreaming,
    updateStreamingText,
    finishStreaming,
    updateProgress,
    setFeedback,
  } = useInterviewStore();

  const startInterview = useCallback(async () => {
    startStreaming();
    let finalMetadata: any = {};

    await sendInterviewTurnStream(sessionId, {
      candidate: selectedCandidate,
      onToken: (token) => {
        updateStreamingText(token);
      },
      onComplete: (data) => {
        finalMetadata = data;
        if (data.currentQuestionIndex !== undefined) {
          updateProgress({
            questionCount: data.currentQuestionIndex,
            daysProbedCount: data.daysProbedCount || 1,
            currentDay: data.currentDay || 7,
            currentDayTitle: data.currentDayTitle || 'Embeddings Explained',
            isFollowup: data.isFollowup || false,
          });
        }
        if (data.done && data.feedback) {
          setFeedback(data.feedback);
        }
      },
      onError: (err) => {
        console.error('Error starting interview:', err);
        updateStreamingText("\n[Connection Error: Please check if backend server is running at port 8000]");
      },
    });

    finishStreaming({
      isFollowup: finalMetadata.isFollowup,
      day: finalMetadata.currentDay,
      dayTitle: finalMetadata.currentDayTitle,
    });
  }, [sessionId, selectedCandidate, startStreaming, updateStreamingText, finishStreaming, updateProgress, setFeedback]);

  const sendCandidateAnswer = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // 1. Add candidate message immediately to UI state
    addMessage({
      sender: 'candidate',
      text: text.trim(),
    });

    // 2. Start streaming interviewer response
    startStreaming();
    let finalMetadata: any = {};

    await sendInterviewTurnStream(sessionId, {
      message: text.trim(),
      onToken: (token) => {
        updateStreamingText(token);
      },
      onComplete: (data) => {
        finalMetadata = data;
        if (data.currentQuestionIndex !== undefined) {
          updateProgress({
            questionCount: data.currentQuestionIndex,
            daysProbedCount: data.daysProbedCount || 1,
            currentDay: data.currentDay || 7,
            currentDayTitle: data.currentDayTitle || 'Embeddings Explained',
            isFollowup: data.isFollowup || false,
          });
        }
        if (data.done && data.feedback) {
          setFeedback(data.feedback);
        }
      },
      onError: (err) => {
        console.error('Error sending answer turn:', err);
        updateStreamingText("\n[Connection Error: Please ensure FastAPI backend is running at http://localhost:8000]");
      },
    });

    finishStreaming({
      isFollowup: finalMetadata.isFollowup,
      day: finalMetadata.currentDay,
      dayTitle: finalMetadata.currentDayTitle,
    });
  }, [sessionId, isStreaming, addMessage, startStreaming, updateStreamingText, finishStreaming, updateProgress, setFeedback]);

  return {
    startInterview,
    sendCandidateAnswer,
    isStreaming,
  };
}
