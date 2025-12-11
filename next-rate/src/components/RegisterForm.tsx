'use client';

type Field = {
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
  min?: number;
  max?: number;
};

type Props = {
  action: string;
  fields: Field[];
  submitLabel: string;
  classNames: {
    formBar: string;
    input: string;
    submitButton: string;
  };
};

export default function RegisterForm({
  action,
  fields,
  submitLabel,
  classNames,
}: Props) {
  return (
    <form action={action} method="POST" className={classNames.formBar}>
      {fields.map((f, idx) => (
        <input
          key={idx}
          name={f.name}
          type={f.type}
          placeholder={f.placeholder}
          required={f.required}
          min={f.min}
          max={f.max}
          className={classNames.input}
        />
      ))}
      <button type="submit" className={classNames.submitButton}>
        {submitLabel}
      </button>
    </form>
  );
}