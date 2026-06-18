import { useState, useCallback, useRef } from 'react';
import ConfirmModal from './ConfirmModal';

export function useConfirm() {
  const [show, setShow] = useState(false);
  const [config, setConfig] = useState({});
  const resolveRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: opts.title || 'Confirm',
        message: opts.message || 'Are you sure?',
        variant: opts.variant || 'danger',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
      });
      setShow(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setShow(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setShow(false);
  }, []);

  const ConfirmDialog = useCallback(({ loading }) => (
    <ConfirmModal
      show={show}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={config.title}
      message={config.message}
      variant={config.variant}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      loading={loading}
    />
  ), [show, config, handleConfirm, handleCancel]);

  return [ConfirmDialog, confirm];
}
