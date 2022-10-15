import React, { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DialogContentProps, DialogProps } from '@radix-ui/react-dialog';
import styles from './index.module.scss';
import { ReactComponent as IconClose } from '../../assets/icons/close.svg';

export type ModalProps = DialogProps & {
  title: string | ReactNode;
  trigger: ReactNode;
  contentProps?: DialogContentProps;
};

const Modal = (props: ModalProps) => {
  const { children, trigger, title, contentProps, ...restProps } = props;

  return (
    <Dialog.Root {...restProps}>
      <Dialog.Trigger className="w-full">{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles['overlay']}>
          <Dialog.Content className={styles['content']} {...contentProps}>
            <div className={'flex justify-between items-center'}>
              <Dialog.Title className={styles['title']}>{title}</Dialog.Title>
              <Dialog.Close className={styles['close']}>
                <IconClose />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
