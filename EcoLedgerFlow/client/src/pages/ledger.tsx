import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Activity, Building2, TreePine, CheckCircle, Clock } from "lucide-react";

export default function Ledger() {
  // Get transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Get stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mint':
        return 'bg-green-100 text-green-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'confirmed' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Ledger Header */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">EcoLedger Blockchain</h2>
                  <p className="text-white/90">Transparent carbon credit transaction ledger</p>
                </div>
              </div>
              {stats && typeof stats === 'object' && 'totalTransactions' in stats && (
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(stats as any).totalTransactions || 0}</div>
                    <div className="text-sm text-white/80">Total Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(stats as any).totalCreditsIssued || 0}</div>
                    <div className="text-sm text-white/80">Credits Issued</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <Activity className="text-purple-600" size={20} />
                <span>Transaction History</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live Network</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading transactions...</div>
            ) : !Array.isArray(transactions) || transactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No transactions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="ledger-table">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Transaction Hash</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">From</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">To</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Credits</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Timestamp</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody data-testid="ledger-transactions">
                    {Array.isArray(transactions) ? transactions.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {tx.transactionHash}
                          </code>
                        </td>
                        <td className="py-4 px-2">
                          <Badge className={getTypeColor(tx.type)}>
                            {tx.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          {tx.fromUser ? (
                            <div className="flex items-center space-x-2">
                              {tx.fromUser.role === 'ngo' ? (
                                <TreePine className="text-primary" size={14} />
                              ) : (
                                <Building2 className="text-accent" size={14} />
                              )}
                              <span className="text-sm">{tx.fromUser.id}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </td>
                        <td className="py-4 px-2">
                          {tx.toUser ? (
                            <div className="flex items-center space-x-2">
                              {tx.toUser.role === 'ngo' ? (
                                <TreePine className="text-primary" size={14} />
                              ) : (
                                <Building2 className="text-accent" size={14} />
                              )}
                              <span className="text-sm">{tx.toUser.id}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </td>
                        <td className="py-4 px-2 font-medium">
                          <span className={tx.type === 'mint' ? '' : 'text-accent'}>
                            {tx.type === 'mint' ? '+' : ''}{tx.amount}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-4 px-2">
                          <Badge className={`${getStatusColor(tx.status)} flex items-center space-x-1 w-fit`}>
                            {tx.status === 'confirmed' ? (
                              <CheckCircle size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            <span className="capitalize">{tx.status}</span>
                          </Badge>
                        </td>
                      </tr>
                    )) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
