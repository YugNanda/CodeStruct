import { useEffect } from 'react';

const BASE_TITLE = 'DSA Visualizer';

/**
 * Sets the document title for the current page.
 * Format: "Page Name — DSA Visualizer"
 * Restores the base title on unmount.
 *
 * @param {string} title - The page-specific title segment.
 */
export function useDocumentTitle(title) {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;

        return () => {
            document.title = previousTitle;
        };
    }, [title]);
}
