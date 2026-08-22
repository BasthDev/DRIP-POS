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
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
        .from('stock_transactions')
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

  const QUICK_ACTIONS = [
    {
      id: 'suppliers',
      title: t('suppliers.title'),
      description: t('dashboard.suppliersDesc'),
      icon: Building2,
      route: '/suppliers',
      permission: 'inventory.view' as const,
    },
    {
      id: 'inventory',
      title: t('inventory.title'),
      description: t('dashboard.inventoryDesc'),
      icon: Package,
      route: '/inventory',
      permission: 'inventory.view' as const,
    },
    {
      id: 'orders',
      title: t('orders.title'),
      description: t('dashboard.ordersDesc'),
      icon: ShoppingCart,
      route: '/orders',
      permission: 'orders.view' as const,
    },
    {
      id: 'reports',
      title: t('settings.title'),
      description: t('dashboard.reportsDesc'),
      icon: BarChart3,
      route: '/settings',
      permission: 'settings.view' as const,
    },
  ];

  const accessibleActions = QUICK_ACTIONS.filter((action) =>
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
              {user?.role || 'Owner'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textTertiary }]}>
              {user?.email || ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dashboard.quickActions')}</Text>
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
          {t('dashboard.recentActivity')}
        </Text>
      </TouchableOpacity>

      {/* Sign Out Trigger Button */}
      <DripButton
        title={t('auth.logout')}
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
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dashboard.recentActivity')}</Text>

      {recentActivities.length > 0 ? (
        recentActivities.map((act, index) => (
          <View key={act.id || index} style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.activityHeader}>
              <Text style={[styles.activityType, { color: theme.text }]}>
                {act.transaction_type || 'Stock Event'}
              </Text>
              <Text style={[styles.activityTime, { color: theme.textTertiary }]}>
                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={[styles.activityDetails, { color: theme.textSecondary }]}>
              {t('common.details')}: {act.quantity} {act.reason ? `• ${act.reason}` : ''}
            </Text>
          </View>
        ))
      ) : (
        <View style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Activity size={32} color={theme.textDisabled} />
          <Text style={[styles.activityText, { color: theme.textSecondary }]}>
            {t('dashboard.noActivities')}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <>
      <Header
        title={t('dashboard.title')}
        subtitle={user?.name ? `${t('common.details')}: ${user.name}` : undefined}
      />
      <DripContainer
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        showSecondaryMobile={showActivityMobile}
        onMobileBack={() => setShowActivityMobile(false)}
        backButtonTitle={t('common.back')}
        childrenPadding={16}
      />

      {/* Sign Out Confirmation Sheet */}
      <DripSheet
        visible={showSignOutSheet}
        onClose={() => setShowSignOutSheet(false)}
        title={t('auth.logout')}
        headerIcon={<LogOut size={20} color={theme.error} />}
        footer={
          <View style={styles.sheetActions}>
            <DripButton
              title={t('auth.stayLoggedIn')}
              onPress={() => setShowSignOutSheet(false)}
              variant="secondary"
              style={styles.sheetButton}
            />
            <DripButton
              title={t('auth.logout')}
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
        <Text style={[styles.signOutMessage, { color: theme.text }]}>
          {t('auth.signOutConfirm')}
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  viewActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  viewActivityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginBottom: 24,
  },
  activityItem: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  activityTime: {
    fontSize: 12,
  },
  activityDetails: {
    fontSize: 13,
  },
  activityCard: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  activityText: {
    fontSize: 14,
    textAlign: 'center',
  },
  signOutMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  sheetButton: {
    flex: 1,
  },
});