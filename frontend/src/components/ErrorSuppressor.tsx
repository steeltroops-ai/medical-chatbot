"use client";

import { useEffect } from "react";

/**
 * ErrorSuppressor - A component that detects and removes error badges from the DOM
 * This uses direct DOM manipulation to ensure error badges don't appear in the UI
 */
export default function ErrorSuppressor() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Create a throttled version of the badge removal function
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const throttledRemoveBadges = () => {
      if (timeoutId) return;

      timeoutId = setTimeout(() => {
        removeErrorBadges();
        timeoutId = null;
      }, 100);
    };

    // Function to remove error badges
    const removeErrorBadges = () => {
      // First direct approach - find elements with error-related text
      document.querySelectorAll("div, span, button").forEach((el) => {
        if (
          el instanceof HTMLElement &&
          (el.innerText?.includes("Issue") ||
            el.innerText?.includes("Error") ||
            el.innerText?.includes("❌"))
        ) {
          // Check for badge-like elements
          if (
            el.classList.contains("badge") ||
            el.closest("[class*='badge']") ||
            el.closest("button[aria-label*='issue']") ||
            el.parentElement?.classList.contains("badge-container") ||
            (el.getAttribute("style")?.includes("border-radius") &&
              el.getBoundingClientRect().width < 100)
          ) {
            hideElement(el);
          }
        }
      });

      // Second approach - target specific elements by attributes
      const selectors = [
        "[aria-label*='issue']",
        "[aria-label*='error']",
        "[class*='badge']",
        "[class*='error']",
        "[class*='issue']",
        "[class*='notification']",
        "[data-type*='error']",
        "[data-testid*='error']",
      ];

      document.querySelectorAll(selectors.join(", ")).forEach(hideElement);

      // Also target elements by position - fixed position elements at bottom
      document
        .querySelectorAll("div[style*='position: fixed']")
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          // If near bottom of screen and small width, likely a badge
          if (rect.bottom > window.innerHeight - 60 && rect.width < 150) {
            hideElement(el);
          }
        });
    };

    // Helper to hide elements
    const hideElement = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;

      try {
        // Try several removal techniques
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.height = "0";
        el.style.width = "0";
        el.style.overflow = "hidden";
        el.ariaHidden = "true";

        // If possible, remove from DOM entirely, but check if element is still in the DOM
        if (el.parentElement && el.isConnected) {
          try {
            el.parentElement.removeChild(el);
          } catch (removeError) {
            // Element might have been removed by another process
            console.debug(
              "Could not remove element, it may have been removed already"
            );
          }
        }
      } catch (e) {
        // Silent fail - badge removal shouldn't break the app
      }
    };

    // Run immediately
    removeErrorBadges();

    // Set up observer to watch for DOM changes
    const observer = new MutationObserver(throttledRemoveBadges);

    // Start observing with all possible options
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    // Clean up on unmount
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
