import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, FAB, Chip, Text, Avatar, IconButton, Menu, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ticketsApi, Ticket } from '../../api/endpoints';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';

export default function TicketListScreen({ navigation }: any) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchTickets = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await ticketsApi.list(params);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [statusFilter, priorityFilter, searchQuery])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return colors.status.open;
      case 'IN_PROGRESS': return colors.status.inProgress;
      case 'WAITING_ON_CUSTOMER': return colors.status.waiting;
      case 'ESCALATED': return colors.error;
      case 'RESOLVED': return colors.status.resolved;
      case 'CLOSED': return colors.status.closed;
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return colors.priority.urgent;
      case 'HIGH': return colors.priority.high;
      case 'NORMAL': return colors.priority.normal;
      case 'LOW': return colors.priority.low;
      default: return colors.textSecondary;
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIdRow}>
          <Text style={styles.ticketId}>#{item.id.slice(-6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item onPress={() => {}} title="Assign" leadingIcon="account-plus" />
          <Menu.Item onPress={() => {}} title="Change Status" leadingIcon="swap-horizontal" />
          <Divider />
          <Menu.Item onPress={() => {}} title="Merge" leadingIcon="merge" />
        </Menu>
      </View>
      
      <Text style={styles.ticketSubject} numberOfLines={2}>
        {item.subject}
      </Text>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.ticketFooter}>
        <View style={styles.ticketMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority}
            </Text>
          </View>
          {item.customer && (
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer.name || item.customer.email}
            </Text>
          )}
        </View>
        <Text style={styles.ticketDate}>
          {format(new Date(item.updatedAt), 'MMM d, HH:mm')}
        </Text>
      </View>
      
      {item.assignee && (
        <View style={styles.assigneeRow}>
          <Avatar.Text size={24} label={item.assignee.name.charAt(0)} />
          <Text style={styles.assigneeName}>{item.assignee.name}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tickets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <Chip
          selected={statusFilter === null}
          onPress={() => setStatusFilter(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={statusFilter === 'OPEN'}
          onPress={() => setStatusFilter(statusFilter === 'OPEN' ? null : 'OPEN')}
          style={styles.filterChip}
        >
          Open
        </Chip>
        <Chip
          selected={statusFilter === 'IN_PROGRESS'}
          onPress={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? null : 'IN_PROGRESS')}
          style={styles.filterChip}
        >
          In Progress
        </Chip>
        <Chip
          selected={statusFilter === 'RESOLVED'}
          onPress={() => setStatusFilter(statusFilter === 'RESOLVED' ? null : 'RESOLVED')}
          style={styles.filterChip}
        >
          Resolved
        </Chip>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tickets found</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('TicketCreate')}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ticketDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.sm,
    flex: 1,
  },
  ticketDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assigneeName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});
