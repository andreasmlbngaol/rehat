"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder = "••••••••",
  ...props
}: React.ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-9"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeSlash /> : <Eye />}
      </Button>
    </div>
  );
}
