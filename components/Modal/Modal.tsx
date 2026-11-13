import clsx from 'clsx'

import Button from '@/components/Button/Button'
import styles from '@/styles/Audio.module.css'
import type { ModalProps } from '@/types'

export default function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick,
  primaryButtonClassName,
  secondaryButtonClassName,
}: ModalProps) {
  if (!open) return null

  return (
    <div
      className={styles['ar-modal-backdrop']}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
    >
      <div className={styles['ar-modal']}>
        {icon && <div className={styles['ar-modal-icon']}>{icon}</div>}

        {title && <div className={styles['ar-modal-title']}>{title}</div>}

        {description && <div className={styles['ar-modal-sub']}>{description}</div>}

        {children}

        {(primaryButtonText || secondaryButtonText) && (
          <div className={styles['ar-modal-actions']}>
            {secondaryButtonText && (
              <Button
                type="button"
                className={clsx(
                  styles['ar-modal-btn'],
                  styles['ar-modal-btn-secondary'],
                  secondaryButtonClassName
                )}
                onClick={onSecondaryClick || onClose}
              >
                {secondaryButtonText}
              </Button>
            )}

            {primaryButtonText && (
              <Button
                type="button"
                className={clsx(
                  styles['ar-modal-btn'],
                  styles['ar-modal-btn-primary'],
                  primaryButtonClassName
                )}
                onClick={onPrimaryClick || onClose}
              >
                {primaryButtonText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
