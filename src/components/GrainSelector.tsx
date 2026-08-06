//src/components/GrainSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { GrainDirection } from '../algorithm/packing';
import { colors, spacing, radius } from '../theme/theme';

export interface GrainSelectorProps {
  value: GrainDirection;
  onChange: (value: GrainDirection) => void;
  /** Muestra una versión más chica, pensada para ir dentro de una tarjeta de lista. */
  compact?: boolean;
}

const OPTIONS: { key: GrainDirection; label: string; sublabel: string }[] = [
  { key: 'vertical', label: 'Vertical', sublabel: 'de arriba a abajo' },
  { key: 'horizontal', label: 'Horizontal', sublabel: 'de lado a lado' },
  { key: 'none', label: 'No importa', sublabel: 'cualquier corte' },
];

const GrainIcon: React.FC<{ direction: GrainDirection; active: boolean }> = ({ direction, active }) => {
  const stroke = active ? '#fff' : colors.grainLine;
  const boxStroke = active ? '#fff' : colors.borderStrong;
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34">
      <Rect x={2} y={2} width={30} height={30} rx={4} fill="none" stroke={boxStroke} strokeWidth={1.5} />
      {direction === 'vertical' &&
        [8, 17, 26].map((x) => (
          <Line key={x} x1={x} y1={5} x2={x} y2={29} stroke={stroke} strokeWidth={1.6} />
        ))}
      {direction === 'horizontal' &&
        [8, 17, 26].map((y) => (
          <Line key={y} x1={5} y1={y} x2={29} y2={y} stroke={stroke} strokeWidth={1.6} />
        ))}
      {direction === 'none' && (
        <>
          <Line x1={8} y1={8} x2={26} y2={26} stroke={stroke} strokeWidth={1.6} />
          <Line x1={26} y1={8} x2={8} y2={26} stroke={stroke} strokeWidth={1.6} />
        </>
      )}
    </Svg>
  );
};

export const GrainSelector: React.FC<GrainSelectorProps> = ({ value, onChange, compact }) => (
  <View style={styles.row}>
    {OPTIONS.map((opt) => {
      const active = value === opt.key;
      return (
        <TouchableOpacity
          key={opt.key}
          onPress={() => onChange(opt.key)}
          style={[styles.option, active && styles.optionActive, compact && styles.optionCompact]}
          activeOpacity={0.85}
        >
          <GrainIcon direction={opt.key} active={active} />
          <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          {!compact && (
            <Text style={[styles.sublabel, active && styles.sublabelActive]}>{opt.sublabel}</Text>
          )}
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
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCompact: {
    paddingVertical: 6,
  },
  optionActive: {
    backgroundColor: colors.grainActiveBg,
    borderColor: colors.grainActiveBg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  labelActive: {
    color: '#fff',
  },
  sublabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sublabelActive: {
    color: 'rgba(255,255,255,0.85)',
  },
});