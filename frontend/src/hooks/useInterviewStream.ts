import { useCallback, useRef } from 'react';
import { useInterviewStore } from '../lib/store';
import { sendInterviewTurnStream } from '../lib/api';
import { useToast } from '../components/ui/Toast';

type TurnLifecycle = 'idle' | 'streaming' | 'completed' | 'failed';

export function useInterviewStream() {
  const sendingRef = useRef(false);
  const turnLifecycleRef = useRef<TurnLifecycle>('idle');

  const {
    sessionId,
    selectedCandidate,
    isStreaming,
    addMessage,
    startStreaming,
    cancelStreaming,
    addThinkingPhase,
    updateStreamingText,
    finishStreaming,
    updateProgress,
    setFeedback,
    claimSessionInitialization,
    setInitializationStatus,
  } = useInterviewStore();

  const { addToast } = useToast();

  const startInterview = useCallback(async () => {
    // Session-level initialization claim (atomic in Zustand)
    const claimed = claimSessionInitialization(sessionId);
    if (!claimed) {
      return;
    }

    turnLifecycleRef.current = 'streaming';

    try {
      startStreaming();

      addToast(
        'Interview session started',
        `Assessing ${selectedCandidate.member.name}`,
        'info'
      );

      const requestId = `req-init-${sessionId}`;
      let finalMetadata: any = {};

      await sendInterviewTurnStream(sessionId, {
        candidate: selectedCandidate,
        requestId,

        onPhase: (phase) => {
          addThinkingPhase(phase);
        },

        onToken: (token) => {
          updateStreamingText(token);
        },

        onComplete: (data) => {
          if (turnLifecycleRef.current !== 'streaming') {
            return;
          }
          turnLifecycleRef.current = 'completed';

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

          finishStreaming({
            isFollowup: finalMetadata.isFollowup,
            day: finalMetadata.currentDay,
            dayTitle: finalMetadata.currentDayTitle,
            reply: finalMetadata.reply,
          } as any);

          setInitializationStatus(sessionId, 'initialized');
        },

        onError: (err) => {
          if (turnLifecycleRef.current === 'completed' || turnLifecycleRef.current === 'failed') {
            return;
          }
          turnLifecycleRef.current = 'failed';

          console.error('[INTERVIEW_ERROR] startInterview failed:', err);

          // Clean error separation: reset streaming state WITHOUT calling finishStreaming or adding to messages
          cancelStreaming();
          setInitializationStatus(sessionId, 'failed');

          addToast(
            'Connection Error',
            err.message || 'Unable to connect to the interview engine.',
            'error'
          );
        },
      });
    } catch (err: any) {
      const state = turnLifecycleRef.current as TurnLifecycle;
      if (state !== 'completed' && state !== 'failed') {
        turnLifecycleRef.current = 'failed';
        cancelStreaming();
        setInitializationStatus(sessionId, 'failed');
        addToast('Connection Error', err.message || 'Unable to connect to the interview engine.', 'error');
      }
    }
  }, [
    sessionId,
    selectedCandidate,
    startStreaming,
    cancelStreaming,
    addThinkingPhase,
    updateStreamingText,
    finishStreaming,
    updateProgress,
    setFeedback,
    addToast,
    claimSessionInitialization,
    setInitializationStatus,
  ]);

  const sendCandidateAnswer = useCallback(
    async (text: string) => {
      // Synchronous guard against rapid double-submit
      if (!text.trim() || isStreaming || sendingRef.current) {
        return;
      }

      // Lock immediately before any async operation
      sendingRef.current = true;
      turnLifecycleRef.current = 'streaming';

      try {
        const requestId = `req-turn-${sessionId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        addMessage({
          sender: 'candidate',
          text: text.trim(),
          requestId,
        });

        startStreaming();

        let finalMetadata: any = {};

        await sendInterviewTurnStream(sessionId, {
          message: text.trim(),
          requestId,

          onPhase: (phase) => {
            addThinkingPhase(phase);
          },

          onToken: (token) => {
            updateStreamingText(token);
          },

          onComplete: (data) => {
            if (turnLifecycleRef.current !== 'streaming') {
              return;
            }
            turnLifecycleRef.current = 'completed';

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

            finishStreaming({
              isFollowup: finalMetadata.isFollowup,
              day: finalMetadata.currentDay,
              dayTitle: finalMetadata.currentDayTitle,
              reply: finalMetadata.reply,
            } as any);
          },

          onError: (err) => {
            if (turnLifecycleRef.current === 'completed' || turnLifecycleRef.current === 'failed') {
              return;
            }
            turnLifecycleRef.current = 'failed';

            console.error('[INTERVIEW_ERROR] sendCandidateAnswer failed:', err);

            // Clean error separation: cancel streaming WITHOUT adding error text to transcript
            cancelStreaming();

            addToast(
              'Connection Error',
              err.message || 'Failed to reach FastAPI backend server',
              'error'
            );
          },
        });
      } catch (err: any) {
        const state = turnLifecycleRef.current as TurnLifecycle;
        if (state !== 'completed' && state !== 'failed') {
          turnLifecycleRef.current = 'failed';
          cancelStreaming();
          addToast('Connection Error', err.message || 'Failed to reach FastAPI backend server', 'error');
        }
      } finally {
        // Unlock only after the request/stream finishes
        sendingRef.current = false;
      }
    },
    [
      sessionId,
      isStreaming,
      addMessage,
      startStreaming,
      cancelStreaming,
      addThinkingPhase,
      updateStreamingText,
      finishStreaming,
      updateProgress,
      setFeedback,
      addToast,
    ]
  );

  return {
    startInterview,
    sendCandidateAnswer,
    isStreaming,
  };
}