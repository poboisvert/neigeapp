"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn, signUp } from "@/lib/auth";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }

      setEmail("");
      setPassword("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign In" : "Create Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Sign in to save your favorite streets"
              : "Create an account to start tracking your favorite streets"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <div className='text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50 p-3 rounded-md border border-red-200 dark:border-red-800'>
              {error}
            </div>
          )}

          <Button
            type='submit'
            className={`w-full ${
              mode === "signup"
                ? "bg-green hover:bg-green/90 dark:bg-green dark:hover:bg-green/80 text-white"
                : ""
            }`}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </Button>
        </form>

        <Separator className='my-4' />

        <div className='text-center text-sm'>
          {mode === "signin" ? (
            <div className='space-y-3'>
              <p className='text-gray-600 dark:text-gray-400'>
                Don't have an account?
              </p>
              <button
                type='button'
                onClick={() => setMode("signup")}
                className='w-full px-4 py-2 bg-green text-white font-semibold rounded-md hover:opacity-90 dark:hover:opacity-80 transition-opacity shadow-sm hover:shadow-md active:scale-[0.98]'
              >
                Sign up
              </button>
            </div>
          ) : (
            <p className='text-gray-600 dark:text-gray-400'>
              Already have an account?{" "}
              <button
                type='button'
                onClick={() => setMode("signin")}
                className='text-blue-600 dark:text-blue-400 hover:underline font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors'
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
