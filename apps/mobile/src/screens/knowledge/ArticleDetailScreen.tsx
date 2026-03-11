import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../../theme/colors';

export default function ArticleDetailScreen({ route }: any) {
  const { id } = route.params;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Article {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
});
