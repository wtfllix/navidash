'use client';

import React from 'react';

const inputClassName =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all';

const mutedInputClassName =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all';

interface FieldProps {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ className = '', invalid = false, ...props }: TextInputProps) {
  return (
    <input
      {...props}
      className={`${mutedInputClassName} ${invalid ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : ''} ${className}`.trim()}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function TextArea({ className = '', invalid = false, ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      className={`${inputClassName} ${invalid ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' : ''} ${className}`.trim()}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;
  return <select {...rest} className={`${inputClassName} ${className}`.trim()} />;
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}

const gridColsMap = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: SegmentedControlProps<T>) {
  return (
    <div className={`grid ${gridColsMap[columns]} gap-2`}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 py-2 rounded-md border text-sm transition-colors ${
              selected
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
