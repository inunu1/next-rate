// components/modals/admin/AdminAddModal.tsx
import styles from '../../../Dashboard.module.css';

type Props = {
  onClose: () => void;
};

export default function AdminAddModal({ onClose }: Props) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>管理者追加</h3>
        <input type="text" placeholder="管理者名を入力" />
        <button className={styles.buttonGreen}>追加</button>
        <button onClick={onClose} className={styles.buttonYellow}>閉じる</button>
      </div>
    </div>
  );
}