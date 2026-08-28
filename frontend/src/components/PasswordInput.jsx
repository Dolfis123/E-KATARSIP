// components/PasswordInput.jsx
import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  value,
  onChange,
  name,
  id,
  placeholder = 'Masukkan kata sandi',
  required = false,
  minLength,
  autoComplete = 'current-password',
  icon = true,
  className = '',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {icon && (
        <Lock
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      )}
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`input-field ${icon ? '!pl-10' : '!pl-3.5'} !pr-10 !py-3 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}