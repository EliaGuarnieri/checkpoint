"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  navigationRequestEvent,
  type NavigationRequest,
} from "~/lib/navigation";

export function useUnsavedChangesGuard(dirty: boolean) {
  const router = useRouter();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<"library" | "other">(
    "library",
  );
  const pendingNavigation = useRef<(() => void) | null>(null);
  const historyGuardArmed = useRef(false);
  const rearmHistoryOnCancel = useRef(false);
  const leavingConfirmed = useRef(false);

  useEffect(() => {
    if (leavingConfirmed.current) return;
    if (!dirty) {
      if (historyGuardArmed.current) {
        historyGuardArmed.current = false;
        window.history.back();
      }
      return;
    }
    const currentUrl = window.location.href;
    const currentHistoryState = window.history.state;
    if (
      !historyGuardArmed.current &&
      !rearmHistoryOnCancel.current &&
      window.history.length > 1
    ) {
      // Back first reaches this same-page entry, before Next can leave the route.
      window.history.pushState(currentHistoryState, "", currentUrl);
      historyGuardArmed.current = true;
    }
    const askToLeave = (
      continueNavigation: () => void,
      target: "library" | "other",
    ) => {
      pendingNavigation.current = continueNavigation;
      setLeaveTarget(target);
      setLeaveOpen(true);
    };
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLibraryLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const destination = new URL(link.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname !== "/"
      )
        return;
      event.preventDefault();
      askToLeave(() => {
        if (historyGuardArmed.current) router.replace("/");
        else router.push("/");
      }, "library");
    };
    const guardHistory = (event: PopStateEvent) => {
      const leftCurrentUrl = window.location.href !== currentUrl;
      if (!leftCurrentUrl && !historyGuardArmed.current) return;
      event.stopImmediatePropagation();
      if (leftCurrentUrl) {
        window.history.pushState(currentHistoryState, "", currentUrl);
        historyGuardArmed.current = true;
      } else {
        historyGuardArmed.current = false;
        rearmHistoryOnCancel.current = true;
      }
      askToLeave(() => router.replace("/"), "library");
    };
    const guardNavigationRequest = (event: Event) => {
      const request = event as CustomEvent<NavigationRequest>;
      if (request.detail.destination === window.location.pathname) return;
      event.preventDefault();
      askToLeave(
        () => request.detail.continueNavigation(historyGuardArmed.current),
        "other",
      );
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    window.addEventListener("popstate", guardHistory, true);
    window.addEventListener(navigationRequestEvent, guardNavigationRequest);
    document.addEventListener("click", guardLibraryLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener("popstate", guardHistory, true);
      window.removeEventListener(
        navigationRequestEvent,
        guardNavigationRequest,
      );
      document.removeEventListener("click", guardLibraryLink, true);
    };
  }, [dirty, router]);

  const onLeaveOpenChange = (open: boolean) => {
    setLeaveOpen(open);
    if (!open && pendingNavigation.current) {
      if (rearmHistoryOnCancel.current) {
        if (dirty) {
          window.history.pushState(
            window.history.state,
            "",
            window.location.href,
          );
          historyGuardArmed.current = true;
        }
        rearmHistoryOnCancel.current = false;
      }
      pendingNavigation.current = null;
    }
  };

  const confirmLeave = () => {
    const continueNavigation = pendingNavigation.current;
    pendingNavigation.current = null;
    rearmHistoryOnCancel.current = false;
    leavingConfirmed.current = true;
    setLeaveOpen(false);
    continueNavigation?.();
  };

  return { leaveOpen, leaveTarget, onLeaveOpenChange, confirmLeave };
}
