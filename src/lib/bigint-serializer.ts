/**
 * Utility functions for handling BigInt serialization in API responses
 * Replaces the global BigInt.prototype modification with a proper serializer
 */

/**
 * Recursively converts BigInt values to strings in an object
 * This ensures proper JSON serialization without modifying global prototypes
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }

  return obj;
}

/**
 * Creates a JSON response with proper BigInt serialization
 * Use this instead of NextResponse.json() when your data contains BigInt values
 */
export function createBigIntResponse(data: any, init?: ResponseInit) {
  const serializedData = serializeBigInt(data);
  return Response.json(serializedData, init);
}