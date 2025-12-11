'use client';

type Props = {
  action: string;                  // POST先のURL
  id: string;                      // 削除対象のID
  buttonLabel: string;             // ボタンのラベル（例: 削除, 出禁）
  className: string;               // ボタンのCSSクラス
  onAfterDelete?: () => Promise<void>; // 削除後に追加処理をしたい場合（例: レート再計算）
};

export default function DeleteForm({
  action,
  id,
  buttonLabel,
  className,
  onAfterDelete,
}: Props) {
  return (
    <form
      action={action}
      method="POST"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch(action, { method: 'POST', body: fd });
        if (onAfterDelete) {
          await onAfterDelete();
        }
      }}
      style={{ display: 'inline' }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        {buttonLabel}
      </button>
    </form>
  );
}