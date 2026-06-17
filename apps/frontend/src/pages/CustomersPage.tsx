import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PlusIcon, SearchIcon, TrashIcon } from "lucide-react";

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
  type Customer,
  type CustomerFormData,
  createCustomer,
  deleteCustomer,
  fetchCustomers,
} from "@/lib/customers";

const PAGE_SIZE = 20;

const customerSchema = yup
  .object({
    full_name: yup.string().required("Name is required").max(255),
    email: yup
      .string()
      .required("Email is required")
      .email("Must be a valid email"),
    phone: yup.string().required("Phone is required").max(50),
  })
  .required();

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomers(page, PAGE_SIZE, search || undefined)
      .then((data) => {
        if (cancelled) return;
        setCustomers(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load customers.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
    setFormError("");
    setFormOpen(true);
  }

  function openDeleteModal(customer: Customer) {
    setDeletingCustomer(customer);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      await deleteCustomer(deletingCustomer.id);
      setDeleteOpen(false);
      setDeletingCustomer(null);
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
          <h1 className="text-2xl font-bold">Customers</h1>
          <Button onClick={openAddModal}>
            <PlusIcon />
            Add Customer
          </Button>
        </div>

        <div className="relative max-w-sm">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
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
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {search
                      ? "No customers match your search."
                      : "No customers yet."}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{customer.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteModal(customer)}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon />
                        <span className="sr-only">Delete</span>
                      </Button>
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
              {total} customer{total !== 1 && "s"} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p - 1);
                }}
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
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p + 1);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        error={formError}
        submitting={submitting}
        onSubmit={async (data) => {
          setSubmitting(true);
          setFormError("");
          try {
            await createCustomer(data);
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
            setDeletingCustomer(null);
            setDeleting(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingCustomer?.full_name}</strong>? This action cannot
              be undone.
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

function CustomerFormModal({
  open,
  onOpenChange,
  error,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  submitting: boolean;
  onSubmit: (data: CustomerFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: yupResolver(customerSchema, undefined, {
      mode: "sync",
      raw: true,
    }),
  });

  useEffect(() => {
    if (open) {
      reset({ full_name: "", email: "", phone: "" });
    }
  }, [open, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Name</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button" disabled={submitting} />
              }
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
