import { ProductForm } from "@/components/admin/product-form";
import { createProductAction } from "@/lib/actions/admin-products";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-(family-name:--font-display) text-3xl">
        New listing
      </h1>
      <ProductForm mode="create" action={createProductAction} />
    </div>
  );
}
