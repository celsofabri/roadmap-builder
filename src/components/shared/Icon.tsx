interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Inline stroke icons (Feather-style, 24x24 grid) so the UI stays dependency-free.
 * All of them inherit `currentColor`.
 */
function base(size: number, className: string | undefined, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const PlusIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M12 5v14M5 12h14" />);

export const MenuIcon = ({ size = 20, className }: IconProps) =>
  base(size, className, <path d="M3 6h18M3 12h18M3 18h18" />);

export const CloseIcon = ({ size = 18, className }: IconProps) =>
  base(size, className, <path d="M18 6 6 18M6 6l12 12" />);

export const MoreIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </>,
  );

export const PencilIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />);

export const CopyIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>,
  );

export const TrashIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
    </>,
  );

export const DownloadIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />);

export const UploadIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />);

export const ListIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>,
  );

export const TimelineIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <rect x="3" y="5" width="12" height="4" rx="1.5" />
      <rect x="7" y="15" width="12" height="4" rx="1.5" />
      <rect x="5" y="10" width="10" height="4" rx="1.5" />
    </>,
  );

export const CalendarIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>,
  );

export const TargetIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>,
  );

export const LayersIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5" />);

export const ChevronRightIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="m9 18 6-6-6-6" />);

export const CollapseIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M6.5 10 5 12l1.5 2" />
    </>,
  );

export const ExpandIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M12.5 10 14 12l-1.5 2" />
    </>,
  );

export const SearchIcon = ({ size = 16, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
  );

export const AlertIcon = ({ size = 14, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>,
  );

export const CheckIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M20 6 9 17l-5-5" />);

export const ChevronDownIcon = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="m6 9 6 6 6-6" />);

export const MapIcon = ({ size = 20, className }: IconProps) =>
  base(
    size,
    className,
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </>,
  );
