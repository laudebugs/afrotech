// Directions links for each maps app (plan 0008). The address goes in as
// text: the maps apps place a street address more accurately than the free
// geocoder behind our city map.

/** Google Maps directions; the link the page is built with. */
export const googleDirections = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

/** Apple Maps directions; iOS opens it in the Maps app. */
export const appleDirections = (address: string) => `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;

/** Waze; opens the app when installed, else waze.com. */
export const wazeDirections = (address: string) =>
  `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

/** Android's geo: link, which offers every installed maps app. */
export const geoLink = (address: string) => `geo:0,0?q=${encodeURIComponent(address)}`;

export type MapsApp = "apple" | "google" | "waze";

export const MAPS_APPS: { id: MapsApp; label: string; link: (address: string) => string }[] = [
  { id: "apple", label: "Apple Maps", link: appleDirections },
  { id: "google", label: "Google Maps", link: googleDirections },
  { id: "waze", label: "Waze", link: wazeDirections },
];
