/** Where to load a board item's picture from (our copy, or the remote fallback). */
export const imageSrc = (item: { imageFile: string | null; imageUrl: string | null }) =>
  item.imageFile ? `/api/uploads/${item.imageFile}` : item.imageUrl;
