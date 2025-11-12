"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleGoogleOAuthCallback } from "@/features/auth/presentation/actions/oauth-actions";
import { useAuth } from "@/features/auth/presentation/hooks/useAuth";

/**
 * Google OAuth Callback Page
 *
 * This page handles the OAuth redirect from Google after user authorization.
 * It extracts the authorization code and exchanges it for tokens.
 */
export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Extract parameters from URL
        const code = searchParams.get("code");
        const state = searchParams.get("state"); // userId
        const error = searchParams.get("error");

        // Handle error from Google
        if (error) {
          setStatus("error");
          setErrorMessage(
            error === "access_denied"
              ? "You denied access to Google Tasks. Please try again if you want to connect."
              : `OAuth error: ${error}`
          );
          return;
        }

        // Validate parameters
        if (!code) {
          setStatus("error");
          setErrorMessage("No authorization code received from Google.");
          return;
        }

        const userId = state || user?.id;

        if (!userId) {
          setStatus("error");
          setErrorMessage("User not authenticated. Please log in and try again.");
          return;
        }

        // Exchange code for tokens
        const result = await handleGoogleOAuthCallback(code, userId);

        if (result.success) {
          setStatus("success");

          // Redirect to settings page after 2 seconds
          setTimeout(() => {
            router.push("/settings/integrations");
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage(
            result.error || "Failed to connect Google Tasks. Please try again."
          );
        }
      } catch (error) {
        console.error("Error in OAuth callback:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
        );
      }
    }

    handleCallback();
  }, [searchParams, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Connecting to Google Tasks...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete the authorization.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600 mb-4">
              Your Google Tasks account has been connected.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to settings...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Connection Failed
            </h2>
            <p className="text-red-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push("/settings/integrations")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
