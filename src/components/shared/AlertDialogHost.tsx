/**
 * AlertDialogHost — singleton host for the imperative confirmAlert() helper.
 * Mount once in app/_layout.tsx (sibling to ToastHost).
 * Registers the show function so confirmAlert() can be called from anywhere.
 */

import { useState, useCallback, useEffect } from "react";
import {
  AlertDialog,
  _registerAlertDialogShow,
  type AlertDialogProps,
  type AlertAction,
} from "@/components/ui/alert-dialog";

type AlertState = Omit<AlertDialogProps, "isOpen" | "onClose"> | null;

export function AlertDialogHost() {
  const [state, setState] = useState<AlertState>(null);

  const show = useCallback(
    (props: { title: string; message?: string; actions?: AlertAction[] }) => {
      setState(props);
    },
    []
  );

  const close = useCallback(() => {
    setState(null);
  }, []);

  useEffect(() => {
    _registerAlertDialogShow(show);
  }, [show]);

  if (!state) return null;

  return (
    <AlertDialog
      isOpen
      onClose={close}
      title={state.title}
      message={state.message}
      actions={state.actions}
    />
  );
}
