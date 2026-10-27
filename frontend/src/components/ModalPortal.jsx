import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal: Ensures all popups and dialogs are attached directly to document.body,
 * bypassing any container stacking contexts, layout overflow rules, or navbar z-indexes.
 * Also freezes background scrolling when open.
 */
const ModalPortal = ({ children, isOpen = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(children, document.body);
};

export default ModalPortal;
