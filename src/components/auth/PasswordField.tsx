import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: "new-password" | "current-password";
  minLength?: number;
  required?: boolean;
}

export function PasswordField({
  value,
  onChange,
  autoComplete = "current-password",
  minLength,
  required = true,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="block">
      <span className="text-sm font-medium text-foreground">Password</span>
      <div className="relative mt-2">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full rounded-lg border border-border px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-blush-section hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
