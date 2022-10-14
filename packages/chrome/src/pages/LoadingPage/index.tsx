import styles from './index.module.scss';
import Typo from '../../components/Typo';
import classnames from 'classnames';
import { ReactComponent as LogoGrey } from '../../assets/icons/logo-grey.svg';
import Icon from '../../components/Icon';

const LoadingPage = () => {
  return (
    <div className={classnames(styles['main-page'])}>
      <Icon elClassName={styles['logo']} icon={<LogoGrey />} />
      <Typo.Title className={classnames(styles['suito-title'], 'mt-[12px]')}>
        Loading...
      </Typo.Title>
      <Typo.Title
        className={classnames(
          styles['suito-title'],
          styles['suito-title--black']
        )}
      >
        Suito
      </Typo.Title>
      <Typo.Normal className={classnames(styles['suito-desc'])}>
        The wallet for everyone
      </Typo.Normal>
    </div>
  );
};

export default LoadingPage;
