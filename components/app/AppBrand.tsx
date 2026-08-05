const APP_NAME = "Layout Orchard";

export function AppBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-[#2f4034] font-semibold text-white ${
          compact ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm"
        }`}
        aria-hidden="true"
      >
        LO
      </div>

      <div className="min-w-0">
        <p
          className={`truncate font-semibold tracking-tight text-[#1f2a24] ${
            compact ? "text-sm" : "text-base sm:text-lg"
          }`}
        >
          {APP_NAME}
        </p>
        {!compact && (
          <p className="hidden truncate text-xs text-gray-500 sm:block sm:text-sm">
            Orchard layout management
          </p>
        )}
      </div>
    </div>
  );
}

export { APP_NAME };
