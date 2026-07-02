const readDataProperty = (value: unknown): unknown => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return (value as { data?: unknown }).data;
};

export const extractVestigiosFromResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const firstData = readDataProperty(payload);
  if (Array.isArray(firstData)) {
    return firstData as T[];
  }

  const nestedData = readDataProperty(firstData);
  return Array.isArray(nestedData) ? (nestedData as T[]) : [];
};
