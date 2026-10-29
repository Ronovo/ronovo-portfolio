import { useEffect } from "react";

export function usePageTitle(title: string, siteName: string) {
  useEffect(() => {
    document.title = title === siteName ? siteName : `${title} - ${siteName}`;
  }, [title, siteName]);
}
