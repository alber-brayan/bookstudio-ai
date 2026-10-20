"use client";

import { useEffect, useRef } from "react";

/** Native focus trapping with a short, interruptible spatial transition. */
export function useGlassDialog(open: boolean, onDismiss: () => void, paused: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const dismiss = useRef(onDismiss);
  const motionPaused = useRef(paused);
  const previousOverflow = useRef("");

  useEffect(() => { dismiss.current = onDismiss; motionPaused.current = paused; }, [onDismiss, paused]);
  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    closing.current = false;
    animation.current?.cancel();
    if (!el.open) el.showModal();
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!motionPaused.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current = el.animate([
        { opacity: 0, transform: "perspective(1400px) translateY(22px) rotateX(5deg) scale(.97)" },
        { opacity: 1, transform: "perspective(1400px) translateY(0) rotateX(0deg) scale(1)" },
      ], { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
    }
    return () => {
      animation.current?.cancel();
      animation.current = null;
      closing.current = false;
      if (el.open) el.close();
      document.body.style.overflow = previousOverflow.current;
    };
  }, [open]);

  function requestClose() {
    const el = ref.current;
    if (!el?.open || closing.current) return;
    closing.current = true;
    animation.current?.cancel();
    const finish = () => { document.body.style.overflow = previousOverflow.current; el.close(); dismiss.current(); };
    if (motionPaused.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    const exit = el.animate([
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 0, transform: "translateY(12px) scale(.98)" },
    ], { duration: 150, easing: "cubic-bezier(.4,0,1,1)" });
    animation.current = exit;
    exit.onfinish = finish;
  }

  return { ref, requestClose };
}
