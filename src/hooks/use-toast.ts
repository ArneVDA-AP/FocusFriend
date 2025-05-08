// FILE: src/hooks/use-toast.ts
"use client"

import * as React from "react"
// Import VariantProps and the specific variants type
import type { VariantProps } from "class-variance-authority";
import type { toastVariants } from "@/components/ui/toast"; // Import the variants definition
import type { ToastActionElement } from "@/components/ui/toast" // Keep this

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

// --- Define ToasterToast with explicit optional variant and className ---
// This is the type for the toast object stored in the state array.
type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean; // Managed internally
  onOpenChange?: (open: boolean) => void; // Managed internally
  variant?: VariantProps<typeof toastVariants>['variant']; // Use VariantProps directly from the component's variants
  className?: string; // Add className as optional
};

// ... (actionTypes, genId, toastTimeouts, addToRemoveQueue, reducer, listeners, memoryState, dispatch remain the same) ...
const actionTypes = { ADD_TOAST: "ADD_TOAST", UPDATE_TOAST: "UPDATE_TOAST", DISMISS_TOAST: "DISMISS_TOAST", REMOVE_TOAST: "REMOVE_TOAST", } as const;
let count = 0;
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString(); }
type ActionType = typeof actionTypes;
type Action = | { type: ActionType["ADD_TOAST"]; toast: ToasterToast } | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> } | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] } | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };
interface State { toasts: ToasterToast[] }
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)!);
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId: toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      const toasts = [action.toast, ...state.toasts];
      while (toasts.length > TOAST_LIMIT) {
          const oldestToastId = toasts[toasts.length - 1].id;
          if (toastTimeouts.has(oldestToastId)) {
              clearTimeout(toastTimeouts.get(oldestToastId)!);
              toastTimeouts.delete(oldestToastId);
          }
          toasts.pop();
      }
      return { ...state, toasts };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => { addToRemoveQueue(toast.id); });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        toastTimeouts.forEach(timeout => clearTimeout(timeout));
        toastTimeouts.clear();
        return { ...state, toasts: [] };
      }
      if (toastTimeouts.has(action.toastId)) {
          clearTimeout(toastTimeouts.get(action.toastId)!);
          toastTimeouts.delete(action.toastId);
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => { listener(memoryState); })
}


// --- Define the input type for the toast() function ---
// This type explicitly lists the properties the user can pass.
type Toast = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: VariantProps<typeof toastVariants>['variant']; // Explicitly allow variant
  className?: string; // Explicitly allow className
};


function toast({ ...props }: Toast) { // props is now typed as Toast
  const id = genId()

  const update = (props: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // Create the full ToasterToast object for the state
  const toastToAdd: ToasterToast = {
      ...props, // Spread all properties from the input 'props' (title, desc, action, variant, className...)
      id,
      open: true,
      onOpenChange: (open) => { if (!open) dismiss(); },
  };

  dispatch({
    type: "ADD_TOAST",
    toast: toastToAdd, // Pass the correctly typed object
  })

   addToRemoveQueue(id); // Start timer for auto-removal

  return { id: id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) { listeners.splice(index, 1); }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }