"use client";

import { useTransition } from "react";
import { deleteProductImageAction } from "@/lib/actions/admin-products";

/**
 * A plain button (not a nested <form>) that calls the delete-image server
 * action directly. Each photo tile sits inside the product edit page's own
 * <form>, and HTML forbids a <form> inside a <form> — using a button here
 * instead of a second form avoids that invalid, hydration-breaking nesting.
 */
export function RemoveImageButton({
  imageId,
  productId,
}: {
  imageId: string;
  productId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          deleteProductImageAction(imageId, productId);
        })
      }
      className="w-full text-xs text-danger hover:underline disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
