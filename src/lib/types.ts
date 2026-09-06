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
  currency: string;
  status: string;
  imageUrl: string | null;
};

export type ProductDetail = ProductListItem & {
  description: string;
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
};

export type FilterOptions = {
  brands: string[];
  colors: string[];
};
