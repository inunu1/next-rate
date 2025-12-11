'use client';

type Props = {
  action: string;
  id: string;
  buttonLabel: string;
  className: string;
};

export default function DeleteForm({ action, id, buttonLabel, className }: Props) {
  return (
    <form action={action} method="POST" style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        {buttonLabel}
      </button>
    </form>
  );
}