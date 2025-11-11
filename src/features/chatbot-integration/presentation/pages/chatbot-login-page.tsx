'use client';

import { useState } from 'react';
import { generateVerificationCode } from '../actions/generate-verification-code.action';

interface ChatbotLoginPageProps {
  onLoginSuccess?: (token: string) => void;
  onLoginError?: (error: string) => void;
}

export default function ChatbotLoginPage({ onLoginSuccess, onLoginError }: ChatbotLoginPageProps) {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateCode = async () => {
    if (!userId.trim()) {
      setMessage('Please enter your user ID');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await generateVerificationCode(userId);
      
      if (result.success) {
        setMessage(`Verification code generated: ${result.code}. Please check your notifications.`);
      } else {
        setMessage(result.error || 'Failed to generate code');
        onLoginError?.(result.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating verification code:', error);
      setMessage('An error occurred while generating the code');
      onLoginError?.('An error occurred while generating the code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Chatbot Login</h1>
      
      <div className="mb-4">
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
          User ID
        </label>
        <input
          type="text"
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter your user ID"
        />
      </div>

      <button
        onClick={handleGenerateCode}
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate Verification Code'}
      </button>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes('error') || message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h2 className="text-lg font-medium text-gray-900 mb-2">How to use:</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
          <li>Enter your User ID in the field above</li>
          <li>Click "Generate Verification Code"</li>
          <li>You'll receive a 9-character code via notification</li>
          <li>Use this code with your chatbot to authenticate</li>
        </ol>
      </div>
    </div>
  );
}