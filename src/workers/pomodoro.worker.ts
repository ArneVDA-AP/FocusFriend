// FILE: src/workers/pomodoro.worker.ts

let timerInterval: ReturnType<typeof setInterval> | null = null;
let timeLeft: number = 0;
let currentMode: 'work' | 'shortBreak' | 'longBreak' | null = null;
let xpPerSecond: number = 0.1; // Default, can be updated

console.log("Pomodoro Worker: Script loaded.");

self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;
    // console.log("Pomodoro Worker: Received message", type, payload); // Debug

    switch (type) {
        case 'START':
            if (timerInterval) clearInterval(timerInterval); // Clear previous interval

            timeLeft = payload.duration;
            currentMode = payload.mode;
            xpPerSecond = payload.xpPerSecond ?? xpPerSecond; // Use provided or existing rate

            console.log(`Pomodoro Worker: Starting timer. Mode: ${currentMode}, Duration: ${timeLeft}`);

            timerInterval = setInterval(() => {
                timeLeft--;

                // Send tick update
                self.postMessage({ type: 'POMODORO_TICK', payload: { timeLeft, mode: currentMode } });

                // Award XP only during 'work' mode
                if (timeLeft >= 0 && currentMode === 'work') {
                    self.postMessage({ type: 'AWARD_XP', payload: { amount: xpPerSecond, source: 'Pomodoro Focus' } });
                }

                if (timeLeft < 0) {
                    clearInterval(timerInterval!);
                    timerInterval = null;
                    console.log(`Pomodoro Worker: Timer finished. Mode: ${currentMode}`);
                    self.postMessage({ type: 'POMODORO_COMPLETE', payload: { mode: currentMode } });
                    currentMode = null; // Reset mode after completion
                }
            }, 1000);
            break;

        case 'PAUSE':
            console.log("Pomodoro Worker: Pausing timer.");
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            break;

        case 'RESET':
             console.log(`Pomodoro Worker: Resetting timer. Mode: ${payload.mode}, Duration: ${payload.duration}`);
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            timeLeft = payload.duration;
            currentMode = payload.mode;
            // Send tick update immediately for UI sync
            self.postMessage({ type: 'POMODORO_TICK', payload: { timeLeft, mode: currentMode } });
            break;

        case 'UPDATE_XP_RATE':
             xpPerSecond = payload.xpPerSecond;
             break;

        default:
            console.warn('Pomodoro Worker: Received unknown message type:', type);
    }
};

// Send ready message
self.postMessage({ type: 'POMODORO_WORKER_READY' });
console.log("Pomodoro Worker: Ready.");
export {};
