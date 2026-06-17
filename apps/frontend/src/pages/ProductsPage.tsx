import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type Product,
  type ProductFormData,
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "@/lib/products";

const PAGE_SIZE = 20;

const productSchema = yup.object({
  name: yup.string().required("Name is required").max(255),
  sku: yup.string().required("SKU is required").max(100),
  price: yup
    .number()
    .typeError("Price must be a number")
    .required("Price is required")
    .positive("Price must be greater than 0"),
  quantity: yup
    .number()
    .typeError("Quantity must be a number")
    .required("Quantity is required")
    .integer("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts(page, PAGE_SIZE, search || undefined)
      .then((data) => {
        if (cancelled) return;
        setProducts(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load products.");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, search, refreshKey]);

  function reload() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setPage(1);
      setSearch(value);
    }, 300);
  }

  function openAddModal() {
    setEditingProduct(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormError("");
    setFormOpen(true);
  }

  function openDeleteModal(product: Product) {
    setDeletingProduct(product);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      setDeleteOpen(false);
      setDeletingProduct(null);
      reload();
    } catch {
      /* keep modal open so user can retry */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button onClick={openAddModal}>
            <PlusIcon />
            Add Product
          </Button>
        </div>

        <div className="relative max-w-sm">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            className="pl-9"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {search ? "No products match your search." : "No products yet."}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">{product.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(product)}
                        >
                          <PencilIcon />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteModal(product)}
                          className="text-destructive hover:text-destructive"
                        >
                          <TrashIcon />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {total} product{total !== 1 && "s"} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => { setLoading(true); setPage((p) => p - 1); }}
              >
                Previous
              </Button>
              <span className="flex items-center px-2 text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => { setLoading(true); setPage((p) => p + 1); }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProductFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        error={formError}
        submitting={submitting}
        onSubmit={async (data) => {
          setSubmitting(true);
          setFormError("");
          try {
            if (editingProduct) {
              await updateProduct(editingProduct.id, data);
            } else {
              await createProduct(data);
            }
            setFormOpen(false);
            reload();
          } catch (err: unknown) {
            const message =
              (err as { response?: { data?: { detail?: string } } })?.response
                ?.data?.detail || "Something went wrong.";
            setFormError(message);
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
            setDeletingProduct(null);
            setDeleting(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingProduct?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductFormModal({
  open,
  onOpenChange,
  product,
  error,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  error: string;
  submitting: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
}) {
  const isEdit = product !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema),
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? { name: product.name, sku: product.sku, price: product.price, quantity: product.quantity }
          : { name: "", sku: "", price: undefined as unknown as number, quantity: 0 }
      );
    }
  }, [open, product, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the product details below."
              : "Fill in the details to add a new product."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register("sku")} />
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-xs text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                {...register("quantity")}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" disabled={submitting} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? "Saving..."
                  : "Adding..."
                : isEdit
                  ? "Save Changes"
                  : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
