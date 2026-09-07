export type ProductListItem = {
  id: string;
  sku: string;
  brand: string;
  model: string;
  title: string;
  color: string;
  category: string;
  condition: string;
  priceCents: number;
  /** Pre-markdown price; present and > priceCents only when on sale. */
  compareAtPriceCents: number | null;
  currency: string;
  status: string;
  imageUrl: string | null;
};

export type ProductDetail = ProductListItem & {
  description: string;
  /** Optional — shown as its own "Condition" section on the product page
   * when present, alongside the overall condition grade. */
  conditionNotes: string | null;
  /** Optional — shown as its own "Size" section on the product page when
   * present, e.g. "W 23.5 cm x H 17 cm x D 11.5 cm". */
  dimensions: string | null;
  isConsignment: boolean;
  images: { url: string; alt: string }[];
  authentication: {
    method: string;
    authenticatedBy: string;
    certificateUrl: string | null;
  } | null;
};

export type ShopFilters = {
  brand?: string;
  category?: string;
  color?: string;
  condition?: string;
  priceRange?: string;
  /** Free-text match against brand/model/title. */
  search?: string;
};

export type FilterOptions = {
  brands: string[];
  colors: string[];
};
