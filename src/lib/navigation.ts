export const navigationRequestEvent = "checkpoint:navigation-request";

export interface NavigationRequest {
  readonly destination?: string;
  readonly continueNavigation: (replace: boolean) => void;
}

export function requestNavigation(
  continueNavigation: (replace: boolean) => void,
  destination?: string,
) {
  const request = new CustomEvent<NavigationRequest>(navigationRequestEvent, {
    cancelable: true,
    detail: { destination, continueNavigation },
  });
  if (window.dispatchEvent(request)) continueNavigation(false);
}
