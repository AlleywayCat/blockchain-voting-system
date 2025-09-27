"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: "warning" | "delete" | "none";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  icon = "warning",
  isLoading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (icon) {
      case "warning":
        return (
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case "delete":
        return (
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in-0"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 text-center">
              {getIcon()}
              <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <CardDescription className="text-center leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: "",
    description: "",
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const openDialog = (
    dialogConfig: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>,
    onConfirm: () => void
  ) => {
    setConfig(dialogConfig);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setOnConfirmCallback(null);
  };

  const confirmDialog = () => {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    closeDialog();
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      {...config}
      isOpen={isOpen}
      onClose={closeDialog}
      onConfirm={confirmDialog}
    />
  );

  return {
    openDialog,
    closeDialog,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}