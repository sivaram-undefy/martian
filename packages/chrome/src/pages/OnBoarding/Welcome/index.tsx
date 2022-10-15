import styles from './index.module.scss';
import commonStyles from '../common.module.scss';
import Typo from '../../../components/Typo';
import RectButton from './RectButton';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LogoGrey } from '../../../assets/icons/logo-grey.svg';
import Icon from '../../../components/Icon';
import { ReactComponent as AddIcon } from '../../../assets/icons/martian/add.svg';
import { ReactComponent as RefreshIcon } from '../../../assets/icons/martian/refresh.svg';

const Welcome = () => {
  const navigate = useNavigate();

  function handleCreateNewWallet() {
    navigate('/onboard/create-new-wallet');
  }

  function handleImportWallet() {
    navigate('/onboard/import-wallet');
  }

  return (
    <div
      className={classnames(styles['main-page'], 'h-full', 'justify-between')}
    >
      <Typo.Title className={classnames(styles['martian-title'], 'mt-[36px]')}>
        Welcome to Martian
      </Typo.Title>

      <div className="w-full flex justify-center items-center">
        <div className="w-[116px] h-[116px] flex justify-center items-center border rounded-full">
          <Icon
            elClassName={commonStyles['logo']}
            icon={<LogoGrey color={'#2B211914'} />}
          />
        </div>
      </div>

      <section className={'w-full flex justify-between flex-wrap gap-2'}>
        <RectButton
          theme={'primary'}
          icon={<AddIcon />}
          onClick={handleCreateNewWallet}
        >
          Create New Wallet
        </RectButton>
        <RectButton icon={<RefreshIcon />} onClick={handleImportWallet}>
          Import Wallet
        </RectButton>
      </section>
    </div>
  );
};

export default Welcome;
