import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  quantity: number;
}

interface DashboardData {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  lowStockProducts: Product[];
}

const LOW_STOCK_THRESHOLD = 5;

export default function HomePage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [products, customers, orders, allProducts] = await Promise.all([
          client.get("/products/", { params: { page: 1, page_size: 1 } }),
          client.get("/customers/", { params: { page: 1, page_size: 1 } }),
          client.get("/orders/", { params: { page: 1, page_size: 1 } }),
          client.get("/products/", { params: { page: 1, page_size: 100 } }),
        ]);

        const lowStock = (allProducts.data.items as Product[])
          .filter((p) => p.quantity <= LOW_STOCK_THRESHOLD)
          .sort((a, b) => a.quantity - b.quantity);

        setData({
          totalProducts: products.data.total,
          totalCustomers: customers.data.total,
          totalOrders: orders.data.total,
          lowStockProducts: lowStock,
        });
      } catch {
        setError("Failed to load dashboard data.");
      }
    }

    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!data && !error && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{data.totalProducts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{data.totalCustomers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{data.totalOrders}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {data.totalProducts
                      ? "All products are well stocked."
                      : "No product in the inventory."}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {data.lowStockProducts.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">
                          {p.quantity} left
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
