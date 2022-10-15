import classnames from 'classnames';
import styles from './index.module.scss';
import { Extendable } from '../../../../types';
import Icon from '../../../../components/Icon';

export type RectButtonProps = Extendable & {
  theme?: 'primary' | 'default';
  to?: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

const RectButton = (props: RectButtonProps) => {
  const { theme = 'default', icon } = props;

  return (
    <button
      onClick={props.onClick}
      className={classnames(
        styles['rect-btn'],
        styles[`rect-btn--${theme}`],
        'relative',
        props.className
      )}
    >
      <Icon icon={icon} className={classnames([styles['icon']])} />
      {props.children}
    </button>
  );
};

export default RectButton;
