import Link from "next/link";

import { AppBrand } from "./AppBrand";
import { AppNavMenu } from "./AppNavMenu";

type AppHeaderProps =
  | {
      variant: "home";
      onOpenLayouts: () => void;
    }
  | {
      variant: "edit";
    };

export function AppHeader(props: AppHeaderProps) {
  if (props.variant === "edit") {
    return (
      <header className="sticky top-0 z-[60] border-b border-gray-200/80 bg-[#f5f6f2]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-11 items-center justify-between gap-3 px-3 sm:h-12 sm:px-4 lg:px-6">
          <AppBrand compact />

          <Link
            href="/"
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm"
          >
            Back to Home
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200/80 bg-[#f5f6f2]">
      <div className="mx-auto flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <AppBrand />
        <AppNavMenu onOpenLayouts={props.onOpenLayouts} />
      </div>
    </header>
  );
}

export const APP_HEADER_EDIT_HEIGHT_CLASS = "top-11 sm:top-12";