import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalCustomers: number;
  paidCustomers: number;
  renewedCustomers: number;
  totalRevenue: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    paidCustomers: 0,
    renewedCustomers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    loadNotes();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('payment_status, renewal_status, monthly_price');

      if (error) throw error;

      const totalCustomers = customers?.length || 0;
      const paidCustomers = customers?.filter(c => c.payment_status === 'دفع').length || 0;
      const renewedCustomers = customers?.filter(c => c.renewal_status === 'تم').length || 0;
      const totalRevenue = customers?.reduce((sum, c) => sum + (c.monthly_price || 0), 0) || 0;

      setStats({
        totalCustomers,
        paidCustomers,
        renewedCustomers,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "خطأ",
        description: `فشل في تحميل الإحصائيات: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = () => {
    const savedNotes = localStorage.getItem('dashboard-notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      localStorage.setItem('dashboard-notes', notes);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الملاحظات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الملاحظات",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };
  const StatCard = ({ title, value, icon: Icon, className = "" }: {
    title: string;
    value: string | number;
    icon: any;
    className?: string;
  }) => (
    <Card className={`hover-scale transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8">لوحة التحكم</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي العملاء"
          value={stats.totalCustomers}
          icon={Users}
          className="animate-fade-in bg-black/80 text-white border-gray-600"
        />
        <StatCard
          title="العملاء المدفوعون"
          value={stats.paidCustomers}
          icon={CheckCircle}
          className="animate-fade-in bg-black/80 text-white border-green-600"
        />
        <StatCard
          title="التجديدات المكتملة"
          value={stats.renewedCustomers}
          icon={AlertCircle}
          className="animate-fade-in bg-black/80 text-white border-blue-600"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString()} جنيه`}
          icon={DollarSign}
          className="animate-fade-in bg-black/80 text-white border-yellow-600"
        />
      </div>

      {/* ملاحظات المدير */}
      <Card className="animate-scale-in bg-black/80 text-white border-gray-600">
        <CardHeader>
          <CardTitle className="text-center">ملاحظات المدير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظاتك هنا..."
            className="min-h-[120px] text-right bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
          />
          <div className="flex justify-center">
            <Button
              onClick={saveNotes}
              disabled={savingNotes}
              className="hover-scale bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {savingNotes ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-scale-in bg-black/80 text-white border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              معدل الدفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalCustomers > 0 
                ? Math.round((stats.paidCustomers / stats.totalCustomers) * 100)
                : 0}%
            </div>
            <p className="text-sm text-gray-300">
              {stats.paidCustomers} من {stats.totalCustomers} عميل دفعوا
            </p>
          </CardContent>
        </Card>

        <Card className="animate-scale-in bg-black/80 text-white border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              معدل التجديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalCustomers > 0 
                ? Math.round((stats.renewedCustomers / stats.totalCustomers) * 100)
                : 0}%
            </div>
            <p className="text-sm text-gray-300">
              {stats.renewedCustomers} من {stats.totalCustomers} عميل جددوا
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};