export const validateUUID = (uuid: string): boolean => {
  // Check if the input is empty or not a string
  if (!uuid || typeof uuid !== 'string') return false;

  // UUID v4 regex pattern
  // Breakdown:
  // - Matches exactly 36 characters
  // - 8-4-4-4-12 format with hyphens
  // - Checks for correct version (4) and variant (8, 9, A, B)
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidV4Regex.test(uuid);
};
