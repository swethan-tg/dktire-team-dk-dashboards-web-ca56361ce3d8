import { FieldError } from "rizzui";
import cn from "../utils/class-names";

interface QuillEditorProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  error?: string;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  toolbarPosition?: "top" | "bottom";
  [key: string]: unknown;
}

export default function QuillEditor({
  id,
  label,
  error,
  className,
  labelClassName,
  errorClassName,
  toolbarPosition: _toolbarPosition = "top",
  value,
  defaultValue,
  placeholder,
  readOnly,
  onChange,
  onBlur,
  ...props
}: QuillEditorProps) {
  return (
    <div className={cn(className)}>
      {label && (
        <label className={cn("mb-1.5 block", labelClassName)}>{label}</label>
      )}
      <textarea
        id={id}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        onBlur={onBlur}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          "min-h-[160px] w-full rounded-md border border-muted bg-transparent px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
          className
        )}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
      {error && (
        <FieldError size="md" error={error} className={errorClassName} />
      )}
    </div>
  );
}
