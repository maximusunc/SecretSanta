/** Stroke icons used across the app (inherit currentColor). */
type P = { className?: string; size?: number };

function Svg({ size = 24, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: P) => (
  <Svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>
);
export const BoardsIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);
export const ChatIcon = (p: P) => <Svg {...p}><path d="M4 5h16v11H9l-5 4z" /></Svg>;
export const MailIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>
);
export const ClockIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></Svg>;
export const GearIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);
export const BackIcon = (p: P) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
export const SendIcon = (p: P) => <Svg {...p}><path d="M4 12l16-8-6 16-2-7z" /></Svg>;
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const SantaIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="9" r="4" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" /><path d="M10 9h.01M14 9h.01" /></Svg>
);
export const SnowflakeIcon = (p: P) => (
  <Svg {...p}><path d="M12 2v20M4.9 7l14.2 10M4.9 17L19.1 7M9 4l3 3 3-3M9 20l3-3 3 3" /></Svg>
);
export const LinkIcon = (p: P) => <Svg {...p}><path d="M7 17L17 7M9 7h8v8" /></Svg>;

export function StarIcon({ size = 24, className }: P) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 1.5l2.6 6.9 7.4.3-5.8 4.6 2 7.2L12 16.4l-6.2 4.1 2-7.2L2 8.7l7.4-.3z" />
    </svg>
  );
}
