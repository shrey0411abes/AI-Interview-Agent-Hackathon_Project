import { useCallback } from 'react';
import { useInterviewStore } from '../lib/store';
import { sendInterviewTurnStream } from '../lib/api';
import { useToast } from '../components/ui/Toast';

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

  const { addToast } = useToast();

  const startInterview = useCallback(async () => {
    startStreaming();
    addToast('Interview session started', `Assessing ${selectedCandidate.member.name}`, 'info');
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
          addToast('Interview Completed', 'Technical assessment report ready!', 'success');
        }
      },
      onError: (err) => {
        console.error('Error starting interview:', err);
        addToast('Connection Error', 'Backend server unreachable at port 8000', 'error');
        updateStreamingText("\n[Connection Error: Please check if backend server is running at port 8000]");
      },
    });

    finishStreaming({
      isFollowup: finalMetadata.isFollowup,
      day: finalMetadata.currentDay,
      dayTitle: finalMetadata.currentDayTitle,
    });
  }, [sessionId, selectedCandidate, startStreaming, updateStreamingText, finishStreaming, updateProgress, setFeedback, addToast]);

  const sendCandidateAnswer = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    addMessage({
      sender: 'candidate',
      text: text.trim(),
    });

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
          addToast('Interview Completed', 'Technical assessment report ready!', 'success');
        }
      },
      onError: (err) => {
        console.error('Error sending answer turn:', err);
        addToast('Connection Error', 'Failed to reach FastAPI backend server', 'error');
        updateStreamingText("\n[Connection Error: Please ensure FastAPI backend is running at http://localhost:8000]");
      },
    });

    finishStreaming({
      isFollowup: finalMetadata.isFollowup,
      day: finalMetadata.currentDay,
      dayTitle: finalMetadata.currentDayTitle,
    });
  }, [sessionId, isStreaming, addMessage, startStreaming, updateStreamingText, finishStreaming, updateProgress, setFeedback, addToast]);

  return {
    startInterview,
    sendCandidateAnswer,
    isStreaming,
  };
}
