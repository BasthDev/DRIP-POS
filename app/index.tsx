import { DripButton } from '@/components/Button';
import { Header } from '@/components/Header';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { BarChart3, Building2, Package, ShoppingCart } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const QUICK_ACTIONS = [
  {
    id: 'suppliers',
    title: 'Suppliers',
    description: 'Manage supplier relationships',
    icon: Building2,
    route: '/suppliers',
    permission: 'inventory.view' as const,
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Track stock and items',
    icon: Package,
    route: '/inventory',
    permission: 'inventory.view' as const,
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'View and manage orders',
    icon: ShoppingCart,
    route: '/orders',
    permission: 'orders.view' as const,
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Analytics and insights',
    icon: BarChart3,
    route: '/reports',
    permission: 'reports.view' as const,
  },
];

const index = () => {
  const { theme } = useTheme();
  const { user, hasPermission, signOut } = useAuth();

  const accessibleActions = QUICK_ACTIONS.filter(action => 
    hasPermission(action.permission)
  );

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle={`Welcome, ${user?.name || 'User'}`}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
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
                <Text style={[styles.userRole, { color: theme.textSecondary }]}>
                  {user?.role || 'Staff'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.textTertiary }]}>
                  {user?.email || ''}
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

          {/* Recent Activity Placeholder */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.activityText, { color: theme.textSecondary }]}>
              No recent activity to display
            </Text>
          </View>

          {/* Logout Button */}
          <DripButton
            title="Sign Out"
            onPress={signOut}
            variant="danger"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
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
    fontWeight: '500',
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
    marginBottom: 24,
    marginHorizontal: -8,
  },
  actionCard: {
    width: '48%',
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
  activityCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    marginBottom: 24,
  },
});

export default index;