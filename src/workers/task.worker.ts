// FILE: src/workers/task.worker.ts

let timerInterval: ReturnType<typeof setInterval> | null = null;
let currentTaskId: string | null = null;
let elapsedTime: number = 0; // Track elapsed time instead of countdown
let xpPerSecond: number = 0.1; // Default, can be updated

console.log("Task Worker: Script loaded.");

self.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'START':
            // ... (start logic) ...
            break;

        case 'PAUSE':
            console.log(`Task Worker: Pausing timer for Task ID: ${currentTaskId}`);
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
                // --- Send final elapsed time on pause ---
                if (currentTaskId) {
                    self.postMessage({ type: 'TASK_TICK', payload: { taskId: currentTaskId, elapsedTime } });
                }
            }
            break;

        case 'STOP':
             console.log(`Task Worker: Stopping timer for Task ID: ${currentTaskId}`);
             if (timerInterval) {
                 clearInterval(timerInterval);
                 timerInterval = null;
             }
             // --- Send final time before clearing ---
             if (currentTaskId) {
                 self.postMessage({ type: 'TASK_TICK', payload: { taskId: currentTaskId, elapsedTime } });
             }
             currentTaskId = null;
             elapsedTime = 0;
             break;

        case 'UPDATE_XP_RATE':
             xpPerSecond = payload.xpPerSecond;
             break;

        default:
            console.warn('Task Worker: Received unknown message type:', type);
    }
};

// Send ready message
self.postMessage({ type: 'TASK_WORKER_READY' });
console.log("Task Worker: Ready.");
export {};
