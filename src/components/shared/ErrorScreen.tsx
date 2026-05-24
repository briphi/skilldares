import { uiStrings } from '../../content/uiStrings';
import styles from './ErrorScreen.module.css';

export function ErrorScreen() {
  return (
    <div role="alert" className={styles.container}>
      <div className={styles.mark} aria-hidden="true">✗</div>
      <h1 className={styles.heading}>{uiStrings.errorScreen.heading}</h1>
      <p className={styles.body}>{uiStrings.errorScreen.body}</p>
    </div>
  );
}
