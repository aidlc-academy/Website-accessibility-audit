import React from 'react';

interface LiveAnnouncerProps {
  message: string;
}

export const LiveAnnouncer: React.FC<LiveAnnouncerProps> = ({ message }) => {
  return (
    <div
      id="a11y-live-announcer"
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
};
