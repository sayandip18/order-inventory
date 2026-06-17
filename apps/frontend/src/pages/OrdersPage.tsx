import { useEffect, useMemo, useRef, useState } from "react";
import {
  BanIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

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
import { type Customer, fetchCustomers } from "@/lib/customers";
import { type Product, fetchProducts } from "@/lib/products";
import {
  type OrderDetail,
  type OrderSummary,
  cancelOrder,
  createOrder,
  fetchOrder,
  fetchOrders,
} from "@/lib/orders";

const PAGE_SIZE = 20;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortId(id: string) {
  return `#${id.slice(0, 8)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);

  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<OrderSummary | null>(
    null,
  );
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOrders(page, PAGE_SIZE, includeCancelled)
      .then((data) => {
        if (cancelled) return;
        setOrders(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load orders.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, includeCancelled, refreshKey]);

  function reload() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  function openCancelModal(order: OrderSummary) {
    setCancellingOrder(order);
    setCancelOpen(true);
  }

  async function handleCancel() {
    if (!cancellingOrder) return;
    setCancelling(true);
    try {
      await cancelOrder(cancellingOrder.id);
      setCancelOpen(false);
      setCancellingOrder(null);
      reload();
    } catch {
      /* keep modal open so user can retry */
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Button onClick={() => { setCreateKey((k) => k + 1); setCreateOpen(true); }}>
            <PlusIcon />
            Create Order
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={(e) => {
              setIncludeCancelled(e.target.checked);
              setLoading(true);
              setPage(1);
            }}
            className="rounded border-input"
          />
          Show cancelled orders
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-mono">
                      {shortId(order.id)}
                      {order.cancelled && (
                        <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.customer.full_name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setViewingOrderId(order.id)}
                        >
                          <EyeIcon />
                          <span className="sr-only">View</span>
                        </Button>
                        {!order.cancelled && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openCancelModal(order)}
                            className="text-destructive hover:text-destructive"
                          >
                            <BanIcon />
                            <span className="sr-only">Cancel</span>
                          </Button>
                        )}
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
              {total} order{total !== 1 && "s"} total
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

      <CreateOrderModal
        key={createKey}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={reload}
      />

      <OrderDetailModal
        key={viewingOrderId ?? ""}
        orderId={viewingOrderId}
        open={viewingOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingOrderId(null);
        }}
      />

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelOpen(false);
            setCancellingOrder(null);
            setCancelling(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order{" "}
              <strong>{cancellingOrder && shortId(cancellingOrder.id)}</strong>?
              This will restore the product stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={cancelling} />}
            >
              Keep Order
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Order Modal
// ---------------------------------------------------------------------------

interface LineItem {
  product: Product;
  quantity: number;
}

function CreateOrderModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const excludedProductKeys = useMemo(
    () => new Set(lineItems.map((li) => li.product.id)),
    [lineItems],
  );

  const total = lineItems.reduce(
    (sum, li) => sum + li.product.price * li.quantity,
    0,
  );

  function addProduct(product: Product) {
    setLineItems((prev) => [...prev, { product, quantity: 1 }]);
  }

  function removeProduct(productId: string) {
    setLineItems((prev) => prev.filter((li) => li.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    setLineItems((prev) =>
      prev.map((li) =>
        li.product.id === productId ? { ...li, quantity } : li,
      ),
    );
  }

  async function handleSubmit() {
    if (!selectedCustomer || lineItems.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await createOrder({
        customer_id: selectedCustomer.id,
        items: lineItems.map((li) => ({
          product_id: li.product.id,
          quantity: li.quantity,
        })),
      });
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>
            Select a customer and add products to create an order.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Customer selection */}
          <div className="space-y-2">
            <Label>Customer</Label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  {selectedCustomer.full_name}{" "}
                  <span className="text-muted-foreground">
                    ({selectedCustomer.email})
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  <XIcon />
                </Button>
              </div>
            ) : (
              <SearchCombobox<Customer>
                placeholder="Search customers..."
                onSearch={async (q) => {
                  const data = await fetchCustomers(1, 10, q || undefined);
                  return data.items;
                }}
                getKey={(c) => c.id}
                renderOption={(c) => (
                  <div>
                    <div className="font-medium">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.email}
                    </div>
                  </div>
                )}
                onSelect={setSelectedCustomer}
              />
            )}
          </div>

          {/* Product search */}
          <div className="space-y-2">
            <Label>Add Products</Label>
            <SearchCombobox<Product>
              placeholder="Search products..."
              onSearch={async (q) => {
                const data = await fetchProducts(1, 10, q || undefined);
                return data.items;
              }}
              getKey={(p) => p.id}
              renderOption={(p) => (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sku}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{p.price.toFixed(2)}</div>
                    <div>{p.quantity} in stock</div>
                  </div>
                </div>
              )}
              onSelect={addProduct}
              excludeKeys={excludedProductKeys}
            />
          </div>

          {/* Line items */}
          {lineItems.length > 0 && (
            <div className="space-y-2">
              <Label>Items</Label>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Price
                      </th>
                      <th className="px-3 py-2 text-center font-medium">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Subtotal
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr
                        key={li.product.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-3 py-2">{li.product.name}</td>
                        <td className="px-3 py-2 text-right">
                          {li.product.price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() =>
                                updateQuantity(
                                  li.product.id,
                                  li.quantity - 1,
                                )
                              }
                              disabled={li.quantity <= 1}
                            >
                              <MinusIcon />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={li.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  li.product.id,
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              className="h-7 w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() =>
                                updateQuantity(
                                  li.product.id,
                                  li.quantity + 1,
                                )
                              }
                            >
                              <PlusIcon />
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {(li.product.price * li.quantity).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeProduct(li.product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <XIcon />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right font-medium"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {total.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button" disabled={submitting} />
              }
            >
              Cancel
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || !selectedCustomer || lineItems.length === 0
              }
            >
              {submitting ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Order Detail Modal
// ---------------------------------------------------------------------------

function OrderDetailModal({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    fetchOrder(orderId)
      .then((data) => {
        if (!cancelled) {
          setOrder(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load order details.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-2xl">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-destructive">
            {error}
          </div>
        ) : order ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Order {shortId(order.id)}
                {order.cancelled && (
                  <span className="rounded bg-destructive/10 px-2 py-0.5 text-sm font-normal text-destructive">
                    Cancelled
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                Placed on {formatDate(order.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">
                    {order.customer.full_name}
                  </div>
                  <div className="text-muted-foreground">
                    {order.customer.email}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Total</div>
                  <div className="text-xl font-semibold">
                    {order.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left font-medium">SKU</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-3 py-2">{item.product.name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {item.product.sku}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-right font-medium"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {order.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Close
              </DialogClose>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// SearchCombobox – generic searchable dropdown
// ---------------------------------------------------------------------------

function SearchCombobox<T>({
  placeholder,
  onSearch,
  getKey,
  renderOption,
  onSelect,
  excludeKeys,
}: {
  placeholder: string;
  onSearch: (query: string) => Promise<T[]>;
  getKey: (item: T) => string;
  renderOption: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  excludeKeys?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchRef = useRef(onSearch);
  useEffect(() => {
    searchRef.current = onSearch;
  });

  function doSearch(q: string, immediate = false) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const run = async () => {
      setLoading(true);
      try {
        setOptions(await searchRef.current(q));
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    if (immediate) {
      run();
    } else {
      debounceRef.current = setTimeout(run, 300);
    }
  }

  function handleChange(value: string) {
    setQuery(value);
    doSearch(value);
  }

  function handleFocus() {
    setOpen(true);
    if (options.length === 0) doSearch(query, true);
  }

  const filtered = excludeKeys
    ? options.filter((item) => !excludeKeys.has(getKey(item)))
    : options;

  return (
    <div className="relative">
      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="pl-9"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {loading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={getKey(item)}
                className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item);
                  setQuery("");
                }}
              >
                {renderOption(item)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
