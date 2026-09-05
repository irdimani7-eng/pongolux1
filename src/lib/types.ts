export type ProductListItem = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  title: string;
  condition: string;
  priceCents: number;
  currency: string;
  status: string;
  imageUrl: string | null;
};

export type ProductDetail = ProductListItem & {
  description: string;
  category: string;
  isConsignment: boolean;
  images: { url: string; alt: string }[];
  authentication: {
    method: string;
    authenticatedBy: string;
    certificateUrl: string | null;
  } | null;
};
