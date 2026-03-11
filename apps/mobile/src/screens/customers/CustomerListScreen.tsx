import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Avatar, Text, IconButton, Menu, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { customersApi, CustomerProfile } from '../../api/endpoints';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';

export default function CustomerListScreen({ navigation }: any) {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.list({ search: searchQuery });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [searchQuery])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const renderCustomer = ({ item }: { item: CustomerProfile }) => (
    <View style={styles.customerCard}>
      <Avatar.Text size={48} label={item.name?.charAt(0) || '?'} />
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.customerEmail}>{item.email}</Text>
        {item.phone && (
          <Text style={styles.customerPhone}>{item.phone}</Text>
        )}
      </View>
      <Menu
        visible={menuVisible === item.id}
        onDismiss={() => setMenuVisible(null)}
        anchor={
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => setMenuVisible(item.id)}
          />
        }
      >
        <Menu.Item 
          onPress={() => { setMenuVisible(null); navigation.navigate('CustomerDetail', { id: item.id }); }} 
          title="View Details" 
          leadingIcon="eye" 
        />
        <Menu.Item onPress={() => setMenuVisible(null)} title="Create Ticket" leadingIcon="ticket-plus" />
        <Divider />
        <Menu.Item onPress={() => setMenuVisible(null)} title="Send Email" leadingIcon="email" />
      </Menu>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.md,
  },
  searchbar: {
    borderRadius: borderRadius.lg,
  },
  listContent: {
    padding: spacing.md,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  customerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  customerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
