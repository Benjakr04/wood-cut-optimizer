//ListItemCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';

export interface ListItemCardProps {
  color: string;
  title: string;
  badges: { icon?: keyof typeof Ionicons.glyphMap; text: string; tone?: 'default' | 'accent' }[];
  onEdit: () => void;
  onRemove: () => void;
}

export const ListItemCard: React.FC<ListItemCardProps> = ({ color, title, badges, onEdit, onRemove }) => (
  <View style={styles.card}>
    <View style={[styles.colorBar, { backgroundColor: color }]} />
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.badgeRow}>
        {badges.map((b, idx) => (
          <View key={idx} style={[styles.badge, b.tone === 'accent' && styles.badgeAccent]}>
            {b.icon && <Ionicons name={b.icon} size={11} color={b.tone === 'accent' ? colors.primaryDark : colors.textMuted} />}
            <Text style={[styles.badgeText, b.tone === 'accent' && styles.badgeTextAccent]}>{b.text}</Text>
          </View>
        ))}
      </View>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={8}>
        <Ionicons name="create-outline" size={16} color={colors.info} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={styles.deleteBtn} hitSlop={8}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  colorBar: { width: 6 },
  info: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeAccent: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  badgeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  badgeTextAccent: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});