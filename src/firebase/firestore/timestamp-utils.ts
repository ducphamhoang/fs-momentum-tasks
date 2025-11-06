import { Timestamp } from 'firebase/firestore';

/**
 * Recursively converts Firestore Timestamps to JavaScript Dates in an object
 * @param obj The object that may contain Firestore Timestamps
 * @returns A new object with Timestamps converted to JavaScript Dates
 */
export function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Check if this is a Firestore Timestamp
  if (obj instanceof Timestamp || (typeof obj === 'object' && obj.toDate && typeof obj.toDate === 'function')) {
    return obj.toDate();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }

  // Handle objects (but not Date objects)
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertTimestamps(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}