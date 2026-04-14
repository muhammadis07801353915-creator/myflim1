import { useEffect, useRef } from 'react';

export function useHardwareBack(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const id = useRef(Math.random().toString(36).substring(7)).current;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Push a unique state to the history stack to intercept the hardware back button
    window.history.pushState({ hardwareBackId: id }, '');

    const handlePopState = (e: PopStateEvent) => {
      // If the new state's ID doesn't match our unique ID, it means our state was popped
      // (either by the hardware back button or by another component).
      if (e.state?.hardwareBackId !== id) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If the component is closed programmatically (e.g., on-screen back button),
      // our state is still at the top of the stack. We must pop it to keep history clean.
      if (window.history.state?.hardwareBackId === id) {
        window.history.back();
      }
    };
  }, [isOpen, id]);
}
