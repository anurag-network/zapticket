import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Avatar, Button, Chip, IconButton, Divider, Menu, ActivityIndicator } from 'react-native-paper';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ticketsApi, Ticket, Message, User } from '../../api/endpoints';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../theme/colors';
import { format } from 'date-fns';

export default function TicketDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  const { subscribeToTicket, unsubscribeFromTicket, onNewMessage } = useSocket();
  const { user } = useAuth();

  const fetchTicket = async () => {
    try {
      const [ticketData, messagesData] = await Promise.all([
        ticketsApi.get(id),
        ticketsApi.getMessages(id),
      ]);
      setTicket(ticketData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTicket();
      subscribeToTicket(id);
      
      onNewMessage((message) => {
        if (message.ticketId === id) {
          setMessages(prev => [...prev, message]);
        }
      });

      return () => {
        unsubscribeFromTicket(id);
      };
    }, [id])
  );

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    setSending(true);
    try {
      const newMessage = await ticketsApi.addMessage(id, replyText, isInternal);
      setMessages(prev => [...prev, newMessage]);
      setReplyText('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return colors.status.open;
      case 'IN_PROGRESS': return colors.status.inProgress;
      case 'WAITING_ON_CUSTOMER': return colors.status.waiting;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ticket not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={styles.ticketId}>#{ticket.id.slice(-6)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                  {ticket.status.replace('_', ' ')}
                </Text>
              </View>
              <Menu
                visible={menuVisible !== null}
                onDismiss={() => setMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setMenuVisible('main')}
                  />
                }
              >
                <Menu.Item onPress={() => setMenuVisible(null)} title="Assign" leadingIcon="account-plus" />
                <Menu.Item onPress={() => setMenuVisible(null)} title="Change Priority" leadingIcon="flag" />
                <Menu.Item onPress={() => setMenuVisible(null)} title="Merge" leadingIcon="merge" />
                <Divider />
                <Menu.Item onPress={() => setMenuVisible(null)} title="Close Ticket" leadingIcon="close" />
              </Menu>
            </View>
            
            <Text style={styles.subject}>{ticket.subject}</Text>
            
            <View style={styles.metaRow}>
              <Chip 
                icon="flag" 
                style={[styles.priorityChip, { backgroundColor: getPriorityColor(ticket.priority) + '20' }]}
                textStyle={{ color: getPriorityColor(ticket.priority) }}
              >
                {ticket.priority}
              </Chip>
              <Text style={styles.dateText}>
                Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{ticket.description}</Text>
          </Card.Content>
        </Card>

        {ticket.customer && (
          <Card style={styles.customerCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Customer</Text>
              <View style={styles.customerRow}>
                <Avatar.Text size={40} label={ticket.customer.name?.charAt(0) || '?'} />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{ticket.customer.name}</Text>
                  <Text style={styles.customerEmail}>{ticket.customer.email}</Text>
                </View>
                <IconButton icon="phone" onPress={() => {}} />
                <IconButton icon="email" onPress={() => {}} />
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>
            Messages ({messages.length})
          </Text>
          
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageBubble,
                message.isInternal && styles.internalNote
              ]}
            >
              <View style={styles.messageHeader}>
                <Avatar.Text 
                  size={32} 
                  label={message.authorType === 'USER' ? (user?.name?.charAt(0) || 'A') : (ticket.customer?.name?.charAt(0) || 'C')} 
                />
                <View style={styles.messageMeta}>
                  <Text style={styles.authorName}>
                    {message.authorType === 'USER' ? user?.name : ticket.customer?.name}
                  </Text>
                  <Text style={styles.messageTime}>
                    {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                  </Text>
                </View>
                {message.isInternal && (
                  <Chip compact style={styles.internalChip}>Internal</Chip>
                )}
              </View>
              <Text style={styles.messageContent}>{message.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.replyContainer}>
        <View style={styles.replyOptions}>
          <Chip
            selected={!isInternal}
            onPress={() => setIsInternal(false)}
            style={styles.replyTypeChip}
          >
            Reply
          </Chip>
          <Chip
            selected={isInternal}
            onPress={() => setIsInternal(true)}
            style={styles.replyTypeChip}
          >
            Internal Note
          </Chip>
        </View>
        <TextInput
          mode="outlined"
          placeholder="Type your reply..."
          value={replyText}
          onChangeText={setReplyText}
          multiline
          numberOfLines={3}
          style={styles.replyInput}
        />
        <Button
          mode="contained"
          onPress={handleSendReply}
          loading={sending}
          disabled={sending || !replyText.trim()}
          style={styles.sendButton}
        >
          Send Reply
        </Button>
      </View>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ticketId: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subject: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityChip: {
    height: 28,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  descriptionCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  customerCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  customerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  messagesSection: {
    padding: spacing.md,
  },
  messageBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  internalNote: {
    borderLeftColor: colors.warning,
    backgroundColor: colors.warning + '10',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  messageMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  internalChip: {
    height: 24,
    backgroundColor: colors.warning + '30',
  },
  messageContent: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  replyContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyOptions: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  replyTypeChip: {
    marginRight: spacing.sm,
  },
  replyInput: {
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  sendButton: {
    borderRadius: borderRadius.md,
  },
});
