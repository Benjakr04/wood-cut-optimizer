//src/components/FormField.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, Platform } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import { sanitizeDecimalInput, sanitizeIntInput } from '../utils/number';

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  suffix?: string;
  hint?: string;
  /** Acepta decimales con coma o punto y filtra lo que no sirve. */
  decimal?: boolean;
  /** Solo enteros. */
  integer?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suffix,
  hint,
  decimal,
  integer,
}) => {
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    if (decimal) return onChangeText(sanitizeDecimalInput(text));
    if (integer) return onChangeText(sanitizeIntInput(text));
    onChangeText(text);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          keyboardType={keyboardType}
          style={[styles.input, webNoOutline]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          underlineColorAndroid="transparent"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

// En web, el navegador dibuja su propio recuadro celeste de foco sobre el
// input. Lo apagamos: el borde del contenedor ya avisa que estás escribiendo.
const webNoOutline: any =
  Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } : null;

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  // Mismo grosor de borde para que no salte el layout al enfocar.
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  suffix: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  hint: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 3,
  },
});