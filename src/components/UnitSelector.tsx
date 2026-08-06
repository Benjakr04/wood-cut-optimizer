//src/components/UnitSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Unit } from '../algorithm/packing';
import { colors, spacing, radius } from '../theme/theme';

export interface UnitSelectorProps {
  value: Unit;
  onChange: (value: Unit) => void;
}

const UNITS: { key: Unit; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'mm', label: 'mm', icon: 'resize-outline' },
  { key: 'cm', label: 'cm', icon: 'analytics-outline' },
  { key: 'm', label: 'metros', icon: 'expand-outline' },
];

export const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange }) => (
  <View style={styles.row}>
    {UNITS.map((unit) => {
      const active = value === unit.key;
      return (
        <TouchableOpacity
          key={unit.key}
          onPress={() => onChange(unit.key)}
          style={[styles.pill, active && styles.pillActive]}
          activeOpacity={0.85}
        >
          <Ionicons
            name={unit.icon}
            size={14}
            color={active ? '#fff' : colors.textMuted}
          />
          <Text style={[styles.label, active && styles.labelActive]}>{unit.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  labelActive: {
    color: '#fff',
  },
});