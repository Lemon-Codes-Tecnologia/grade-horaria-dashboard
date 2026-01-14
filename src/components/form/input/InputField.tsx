import React, { forwardRef } from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  success?: boolean;
  error?: boolean | string; // Can be boolean or error message
  hint?: string; // Optional hint text
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = "text",
  id,
  name,
  placeholder,
  defaultValue,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  ...rest
}, ref) => {
  // Check if error is a string (error message) or boolean
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : hint;

  // Determine input styles based on state (disabled, success, error)
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  // Add styles for the different states
  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (hasError) {
    inputClasses += ` text-error-800 border-error-500 focus:ring-3 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300 dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  // Remove value from rest to handle it separately
  const { value: restValue, ...restWithoutValue } = rest as any;

  // Build input props conditionally to avoid controlled/uncontrolled switch
  const inputProps: any = {
    ref,
    type,
    id,
    name,
    placeholder,
    onChange,
    min,
    max,
    step,
    disabled,
    className: inputClasses,
    ...restWithoutValue,
  };

  // Handle value prop: if value is explicitly passed (including from react-hook-form),
  // ensure it's always a string to keep the input controlled
  const finalValue = value !== undefined ? value : restValue;
  if (finalValue !== undefined) {
    // Always convert to string, never allow undefined to avoid controlled/uncontrolled switch
    inputProps.value = finalValue === null ? '' : String(finalValue);
  } else if (defaultValue !== undefined) {
    inputProps.defaultValue = defaultValue === null ? '' : defaultValue;
  }

  return (
    <div className="relative">
      <input {...inputProps} />

      {/* Error or Hint Text */}
      {errorMessage && (
        <p
          className={`mt-1.5 text-xs ${
            hasError
              ? "text-error-500 dark:text-error-400"
              : success
              ? "text-success-500 dark:text-success-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
