import { DripButton } from '@/components/Button';
import { DripContainer } from '@/components/Container';
import { Header } from '@/components/Header';
import { DripSheet } from '@/components/Sheet';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Activity, BarChart3, Building2, LogOut, Package, ShoppingCart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const QUICK_ACTIONS = [
  {
    id: 'suppliers',
    title: 'Suppliers',
    description: 'Manage supplier relationships & vendors',
    icon: Building2,
    route: '/suppliers',
    permission: 'inventory.view' as const,
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Track stock items & batches',
    icon: Package,
    route: '/inventory',
    permission: 'inventory.view' as const,
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'View and manage POS sales orders',
    icon: ShoppingCart,
    route: '/orders',
    permission: 'orders.view' as const,
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Analytics, HPP & revenue insights',
    icon: BarChart3,
    route: '/reports',
    permission: 'reports.view' as const,
  },
];

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { user, hasPermission, signOut } = useAuth();
  
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showActivityMobile, setShowActivityMobile] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        setRecentActivities(data);
      }
    } catch (e) {
      console.log('Error fetching recent activity from Supabase:', e);
    }
  };

  const accessibleActions = QUICK_ACTIONS.filter(action => 
    hasPermission(action.permission)
  );

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  // Left Panel Content: User Profile + Quick Actions + Sign Out
  const leftPanel = (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* User Info Card */}
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.userRole, { color: theme.primary }]}>
              {user?.role || 'Owner / Cashier'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textTertiary }]}>
              {user?.email || 'authenticated@pos.drip'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {accessibleActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handleQuickAction(action.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.primary + '20' }]}>
                <IconComponent size={24} color={theme.primary} />
              </View>
              <Text style={[styles.actionTitle, { color: theme.text }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                {action.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Toggle View Activity on Mobile */}
      <TouchableOpacity
        style={[styles.viewActivityButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setShowActivityMobile(true)}
      >
        <Activity size={18} color={theme.primary} />
        <Text style={[styles.viewActivityText, { color: theme.primary }]}>
          View Recent Activity Feed
        </Text>
      </TouchableOpacity>

      {/* Sign Out Trigger Button */}
      <DripButton
        title="Sign Out"
        onPress={() => setShowSignOutSheet(true)}
        variant="danger"
        icon={<LogOut size={18} color="#FFF" />}
        style={styles.logoutButton}
      />
    </ScrollView>
  );

  // Right Panel Content: Activity Feed & Insights
  const rightPanel = (
    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
      
      {recentActivities.length > 0 ? (
        recentActivities.map((act, index) => (
          <View key={act.id || index} style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.activityHeader}>
              <Text style={[styles.activityType, { color: theme.text }]}>
                {act.movement_type || 'Stock Event'}
              </Text>
              <Text style={[styles.activityTime, { color: theme.textTertiary }]}>
                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>
              Qty: {act.quantity} {act.notes ? `• ${act.notes}` : ''}
            </Text>
          </View>
        ))
      ) : (
        <View style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Activity size={32} color={theme.textDisabled} />
          <Text style={[styles.activityText, { color: theme.textSecondary }]}>
            No recent activity logged in Supabase yet.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle={`Welcome, ${user?.name || 'User'}`}
      />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={showActivityMobile}
        onMobileBack={() => setShowActivityMobile(false)}
        backButtonTitle="Back to Dashboard"
        childrenPadding={16}
      />

      {/* Responsive DripSheet for Sign Out Confirmation */}
      <DripSheet
        visible={showSignOutSheet}
        onClose={() => setShowSignOutSheet(false)}
        title="Sign Out Confirmation"
        headerIcon={<LogOut size={20} color={theme.error} />}
        footer={
          <View style={styles.sheetFooter}>
            <DripButton
              title="Cancel"
              onPress={() => setShowSignOutSheet(false)}
              variant="secondary"
              style={styles.sheetButton}
            />
            <DripButton
              title="Yes, Sign Out"
              onPress={() => {
                setShowSignOutSheet(false);
                signOut();
              }}
              variant="danger"
              style={styles.sheetButton}
            />
          </View>
        }
      >
        <Text style={[styles.signOutPrompt, { color: theme.textSecondary }]}>
          Are you sure you want to log out of your DRIP POS session?
        </Text>
      </DripSheet>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginHorizontal: -8,
  },
  actionCard: {
    width: '46%',
    margin: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  viewActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  viewActivityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  activityText: {
    fontSize: 14,
    textAlign: 'center',
  },
  activityItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
  },
  activityDetails: {
    fontSize: 12,
  },
  logoutButton: {
    marginBottom: 24,
  },
  signOutPrompt: {
    fontSize: 15,
    marginVertical: 12,
    lineHeight: 22,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  sheetButton: {
    flex: 1,
  },
});