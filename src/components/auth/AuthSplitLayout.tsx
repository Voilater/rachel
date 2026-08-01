import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const AUTH_IMAGE = "/images/journal.jpg";
const LOGIN_IMAGE = "/images/philosophy.jpg";

interface AuthSplitLayoutProps {
  children: ReactNode;
  imagePosition?: "left" | "right";
  imageSrc?: string;
}

export function AuthSplitLayout({
  children,
  imagePosition = "right",
  imageSrc = AUTH_IMAGE,
}: AuthSplitLayoutProps) {
  const image = (
    <div className="relative hidden min-h-[320px] overflow-hidden bg-image-tint lg:block lg:min-h-full">
      <img src={imageSrc} alt="" className="size-full object-cover" />
      <div className="absolute inset-0 bg-burgundy/10" />
    </div>
  );

  const form = (
    <div className="flex items-center justify-center px-6 py-12 md:px-10 lg:px-14">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        {imagePosition === "left" ? (
          <>
            {image}
            {form}
          </>
        ) : (
          <>
            {form}
            {image}
          </>
        )}
      </div>
      <p className="pb-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="text-burgundy hover:underline">Back to store</Link>
      </p>
    </div>
  );
}

export const loginHeroImage = LOGIN_IMAGE;
export const signupHeroImage = AUTH_IMAGE;
