import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Avatar, Badge } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { dashboardApi, DashboardMetrics } from '../../api/endpoints';
import { useSocket } from '../../contexts/SocketContext';
import { colors, spacing, borderRadius } from '../../theme/colors';

export default function DashboardScreen({ navigation }: any) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { connected, onMetricsUpdate } = useSocket();

  const fetchMetrics = async () => {
    try {
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMetrics();
    }, [])
  );

  useEffect(() => {
    onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.status.open;
      case 'pending': return colors.status.inProgress;
      case 'resolved': return colors.status.resolved;
      case 'closed': return colors.status.closed;
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.priority.urgent;
      case 'high': return colors.priority.high;
      case 'normal': return colors.priority.normal;
      case 'low': return colors.priority.low;
      default: return colors.textSecondary;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>
        <View style={styles.statusIndicator}>
          <Badge style={{ backgroundColor: connected ? colors.success : colors.error }}>
            {connected ? 'Live' : 'Offline'}
          </Badge>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <Icon name="ticket" size={24} color={colors.status.open} />
              <Text style={styles.statLabel}>Open</Text>
            </View>
            <Text style={styles.statValue}>{metrics?.tickets.open || 0}</Text>
            <Text style={styles.statSubtext}>
              {metrics?.tickets.today || 0} new today
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <Icon name="clock-outline" size={24} color={colors.status.inProgress} />
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <Text style={styles.statValue}>{metrics?.tickets.pending || 0}</Text>
            <Text style={styles.statSubtext}>
              Awaiting response
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <Icon name="check-circle" size={24} color={colors.status.resolved} />
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <Text style={styles.statValue}>{metrics?.tickets.resolved || 0}</Text>
            <Text style={styles.statSubtext}>
              {metrics?.tickets.closed || 0} closed
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statHeader}>
              <Icon name="clock-fast" size={24} color={colors.primary} />
              <Text style={styles.statLabel}>Avg Response</Text>
            </View>
            <Text style={styles.statValue}>
              {formatTime(metrics?.responseTime.avgFirstResponse || 0)}
            </Text>
            <Text style={styles.statSubtext}>
              First response
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.sectionCard}>
        <Card.Title title="Agent Status" />
        <Card.Content>
          <View style={styles.agentStatus}>
            <View style={styles.agentItem}>
              <View style={[styles.agentDot, { backgroundColor: colors.success }]} />
              <Text style={styles.agentLabel}>Online</Text>
              <Text style={styles.agentCount}>{metrics?.agents.online || 0}</Text>
            </View>
            <View style={styles.agentItem}>
              <View style={[styles.agentDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.agentLabel}>Away</Text>
              <Text style={styles.agentCount}>{metrics?.agents.away || 0}</Text>
            </View>
            <View style={styles.agentItem}>
              <View style={[styles.agentDot, { backgroundColor: colors.error }]} />
              <Text style={styles.agentLabel}>Busy</Text>
              <Text style={styles.agentCount}>{metrics?.agents.busy || 0}</Text>
            </View>
            <View style={styles.agentItem}>
              <View style={[styles.agentDot, { backgroundColor: colors.textMuted }]} />
              <Text style={styles.agentLabel}>Offline</Text>
              <Text style={styles.agentCount}>{metrics?.agents.offline || 0}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title="SLA Compliance" />
        <Card.Content>
          <View style={styles.slaContainer}>
            <View style={styles.slaRing}>
              <Text style={styles.slaPercentage}>
                {metrics?.sla.complianceRate || 0}%
              </Text>
              <Text style={styles.slaLabel}>Compliance</Text>
            </View>
            <View style={styles.slaStats}>
              <View style={styles.slaItem}>
                <Text style={styles.slaValue}>{metrics?.sla.atRisk || 0}</Text>
                <Text style={styles.slaItemLabel}>At Risk</Text>
              </View>
              <View style={styles.slaItem}>
                <Text style={[styles.slaValue, { color: colors.error }]}>
                  {metrics?.sla.breached || 0}
                </Text>
                <Text style={styles.slaItemLabel}>Breached</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title="Customer Satisfaction" />
        <Card.Content>
          <View style={styles.csatContainer}>
            <Avatar.Text 
              size={64} 
              label={`${metrics?.satisfaction.avgScore || 0}%`}
              style={{ backgroundColor: colors.primary }}
            />
            <View style={styles.csatStats}>
              <Text style={styles.csatScore}>
                {metrics?.satisfaction.avgScore || 0}%
              </Text>
              <Text style={styles.csatLabel}>
                {metrics?.satisfaction.totalResponses || 0} responses
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    borderRadius: borderRadius.lg,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  statSubtext: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionCard: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  agentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  agentItem: {
    alignItems: 'center',
  },
  agentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  agentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  agentCount: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  slaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slaRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  slaPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  slaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  slaStats: {
    flex: 1,
  },
  slaItem: {
    marginBottom: spacing.md,
  },
  slaValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.warning,
  },
  slaItemLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  csatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  csatStats: {
    marginLeft: spacing.lg,
  },
  csatScore: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  csatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
