import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, IconButton } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../theme/colors';

const mockNotifications = [
  {
    id: '1',
    title: 'New Ticket Assigned',
    message: 'Ticket #12345 has been assigned to you',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    title: 'SLA Warning',
    message: 'Ticket #12340 is approaching SLA breach',
    time: '15 min ago',
    read: false,
  },
  {
    id: '3',
    title: 'Customer Reply',
    message: 'John Doe replied to ticket #12342',
    time: '1 hour ago',
    read: true,
  },
];

export default function NotificationsScreen() {
  const renderNotification = ({ item }: any) => (
    <Card style={[styles.card, !item.read && styles.unread]}>
      <Card.Content style={styles.cardContent}>
        <Avatar.Text size={40} label={item.title.charAt(0)} />
        <View style={styles.content}>
          <Text style={[styles.title, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
