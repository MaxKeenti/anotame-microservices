import { StatCard } from "@/components/ui/StatCard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="$12,340" 
          trend="+12% vs last month" 
          trendUp={true} 
        />
        <StatCard 
          title="Active Orders" 
          value="24" 
          trend="+4 new today" 
          trendUp={true} 
        />
        <StatCard 
          title="Pending Delivery" 
          value="8" 
          trend="Due within 24h" 
          trendUp={false} 
        />
        <StatCard 
          title="Total Customers" 
          value="1,203" 
          trend="+5% vs last month" 
          trendUp={true} 
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-semibold text-lg">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    #ORD-00{i}
                  </td>
                  <td className="px-6 py-4">Oscar Wilde</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4">$150.00</td>
                  <td className="px-6 py-4 text-muted-foreground">Oct 24, 2024</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
