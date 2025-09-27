"use client";

import React, { ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface VotingErrorBoundaryProps {
  children: ReactNode;
  context?: 'voting' | 'poll-creation' | 'poll-management' | 'wallet-connection';
}

const getContextualErrorMessage = (context?: string, error?: Error) => {
  const errorMessage = error?.message?.toLowerCase() || '';

  // Check for common blockchain/Solana errors
  if (errorMessage.includes('wallet')) {
    return {
      title: 'Wallet Connection Error',
      message: 'Please connect your wallet and try again.',
      suggestion: 'Make sure your wallet is unlocked and connected to the correct network.'
    };
  }

  if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
    return {
      title: 'Insufficient Balance',
      message: 'You don\'t have enough SOL to complete this transaction.',
      suggestion: 'Please add funds to your wallet and try again.'
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the Solana network.',
      suggestion: 'Please check your internet connection and try again.'
    };
  }

  if (errorMessage.includes('transaction') || errorMessage.includes('signature')) {
    return {
      title: 'Transaction Failed',
      message: 'The blockchain transaction could not be completed.',
      suggestion: 'This might be due to network congestion. Please try again in a moment.'
    };
  }

  // Context-specific fallbacks
  switch (context) {
    case 'voting':
      return {
        title: 'Voting Error',
        message: 'Unable to cast your vote at this time.',
        suggestion: 'Please ensure the poll is active and you haven\'t already voted.'
      };
    case 'poll-creation':
      return {
        title: 'Poll Creation Error',
        message: 'Unable to create the poll.',
        suggestion: 'Please check your poll details and try again.'
      };
    case 'poll-management':
      return {
        title: 'Poll Management Error',
        message: 'Unable to manage the poll.',
        suggestion: 'Please ensure you are the poll creator and try again.'
      };
    case 'wallet-connection':
      return {
        title: 'Wallet Connection Error',
        message: 'Unable to connect to your wallet.',
        suggestion: 'Please make sure your wallet extension is installed and unlocked.'
      };
    default:
      return {
        title: 'Application Error',
        message: 'An unexpected error occurred in the voting application.',
        suggestion: 'Please refresh the page and try again.'
      };
  }
};

export function VotingErrorBoundary({ children, context }: VotingErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log voting-specific error context
    console.error(`Voting app error in ${context || 'unknown'} context:`, {
      error: error.message,
      stack: error.stack,
      context,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // You could send this to an error reporting service
    // reportError(error, { context, ...errorInfo });
  };

  const customFallback = (error?: Error) => {
    const { title, message, suggestion } = getContextualErrorMessage(context, error);

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl max-w-md mx-auto">
        <div className="text-red-600 text-xl font-bold mb-3 text-center">
          {title}
        </div>
        <div className="text-red-700 text-base mb-4 text-center">
          {message}
        </div>
        <div className="text-red-600 text-sm mb-6 text-center bg-red-100 p-3 rounded-lg">
          💡 {suggestion}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={customFallback()} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}