import styles from "./index.module.scss";

export default function MainPage() {
  return (
    <div className={styles['main-page']}>
      <div className={styles['suiet-title']}>Suiet</div>
      <div className={styles['create-new-btn']}>Create New</div>
      <div className={styles['import-wallet-btn']}>Import Wallet</div>
    </div>
  );
}