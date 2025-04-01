import React from "react";

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  return (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default ErrorBanner;
