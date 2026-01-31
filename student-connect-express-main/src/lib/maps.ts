/**
 * Generate a Google Maps URL for a given location
 */
export function getGoogleMapsUrl(location: string): string {
  const encoded = encodeURIComponent(location);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Generate a Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(from: string, to: string): string {
  const encodedFrom = encodeURIComponent(from);
  const encodedTo = encodeURIComponent(to);
  return `https://www.google.com/maps/dir/?api=1&origin=${encodedFrom}&destination=${encodedTo}`;
}
