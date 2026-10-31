import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
const openDialogs = [];
let previousOverflow = "";
export default function ModalPortal({
  children,
  isOpen = true,
  label = "Dialog",
}) {
  const root = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const node = root.current;
    const previousFocus = document.activeElement;
    if (!openDialogs.length) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    }
    openDialogs.push(node);
    const focusable = () =>
      [
        ...node.querySelectorAll(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length);
    const timer = setTimeout(() => (focusable()[0] || node).focus(), 0);
    const trap = (event) => {
      if (openDialogs.at(-1) !== node || event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items.at(-1);
      if (!first) {
        event.preventDefault();
        node.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !node.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !node.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", trap);
      const index = openDialogs.indexOf(node);
      if (index >= 0) openDialogs.splice(index, 1);
      if (!openDialogs.length) {
        document.body.style.overflow = previousOverflow;
        document.body.classList.remove("modal-open");
      }
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);
  return isOpen
    ? createPortal(
        <div
          ref={root}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
        >
          {children}
        </div>,
        document.body,
      )
    : null;
}
