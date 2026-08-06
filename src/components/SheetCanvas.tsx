//src/components/SheetCanvas.tsx
import React from 'react';
import { Pressable } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Circle } from 'react-native-svg';
import { CuttingLayout, PlacedCut } from '../algorithm/packing';
import { colors } from '../theme/theme';
import { colorForPiece } from '../utils/pieceColor';
import { formatMm, unitSymbol } from '../utils/unitConversion';

export function selectionKey(cut: PlacedCut): string {
  return `${cut.materialId}-${cut.index}`;
}

export function grainLabel(grain: CuttingLayout['grain']): string | null {
  if (grain === 'vertical') return 'Veta ↕';
  if (grain === 'horizontal') return 'Veta ↔';
  return null;
}

// Paso de grilla "prolijo" para que siempre se vean entre 4 y 8 líneas.
function calcGridStep(total: number): number {
  const target = total / 6;
  const steps = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
  for (const step of steps) if (target <= step) return step;
  return steps[steps.length - 1];
}

export interface SheetCanvasProps {
  layout: CuttingLayout;
  canvasWidth: number;
  canvasHeight: number;
  selectedKey?: string | null;
  /** Dibuja TODAS las líneas de corte a la vez (modo plano). */
  showAllSteps?: boolean;
  /** Modo guía: número (1-based) del paso que se va a hacer ahora. */
  stepIndex?: number | null;
  /** Marca los sobrantes reutilizables. */
  showOffcuts?: boolean;
  onSelect?: (cut: PlacedCut, color: string) => void;
}

export const SheetCanvas: React.FC<SheetCanvasProps> = ({
  layout,
  canvasWidth,
  canvasHeight,
  selectedKey,
  showAllSteps = false,
  stepIndex = null,
  showOffcuts = false,
  onSelect,
}) => {
  const scale = Math.min(canvasWidth / layout.width, canvasHeight / layout.height, 1);
  const renderW = layout.width * scale;
  const renderH = layout.height * scale;
  const gridStep = calcGridStep(Math.max(layout.width, layout.height));
  const unit = layout.unit || 'mm';

  const guideMode = stepIndex !== null && stepIndex > 0 && layout.cutSteps.length > 0;
  const activeStep = guideMode ? layout.cutSteps[Math.min(stepIndex, layout.cutSteps.length) - 1] : null;
  const doneSteps = guideMode ? layout.cutSteps.slice(0, Math.max(0, (stepIndex as number) - 1)) : [];

  const gridLinesX: number[] = [];
  for (let x = gridStep; x < layout.width; x += gridStep) gridLinesX.push(x);
  const gridLinesY: number[] = [];
  for (let y = gridStep; y < layout.height; y += gridStep) gridLinesY.push(y);

  // Hit-testing por coordenadas en vez de onPress en cada primitivo del SVG
  // (react-native-svg usa un sistema de touch viejo que rompe en Web).
  const handlePress = (event: GestureResponderEvent) => {
    if (!onSelect) return;
    const { locationX, locationY } = event.nativeEvent;
    const sheetX = locationX / scale;
    const sheetY = locationY / scale;
    const hit = layout.placedCuts.find(
      (cut) =>
        sheetX >= cut.x &&
        sheetX <= cut.x + cut.width &&
        sheetY >= cut.y &&
        sheetY <= cut.y + cut.height
    );
    if (hit) onSelect(hit, colorForPiece(hit.name, hit.originalWidth, hit.originalHeight));
  };

  // Texto siempre del mismo tamaño en pantalla: como el viewBox está en mm,
  // "tamaño en mm" × scale = px.
  const fontSizeName = 13.5 / scale;
  const fontSizeDims = 12 / scale;
  const strokeW = 2.4 / scale;
  const gLabel = grainLabel(layout.grain);

  return (
    <Pressable onPress={handlePress} style={{ width: renderW, height: renderH }}>
      <Svg width={renderW} height={renderH} viewBox={`0 0 ${layout.width} ${layout.height}`}>
        <Rect
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          fill={colors.surfaceSunken}
          stroke={colors.dark}
          strokeWidth={2 / scale}
        />

        {gridLinesX.map((x) => (
          <Line
            key={`gx-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={layout.height}
            stroke={colors.borderStrong}
            strokeWidth={1 / scale}
            strokeDasharray={`${3 / scale},${3 / scale}`}
          />
        ))}
        {gridLinesY.map((y) => (
          <Line
            key={`gy-${y}`}
            x1={0}
            y1={y}
            x2={layout.width}
            y2={y}
            stroke={colors.borderStrong}
            strokeWidth={1 / scale}
            strokeDasharray={`${3 / scale},${3 / scale}`}
          />
        ))}

        {showOffcuts &&
          layout.freeRects.map((r, i) => (
            <Rect
              key={`off-${i}`}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill={colors.offcutFill}
              stroke={colors.offcutStroke}
              strokeWidth={1 / scale}
              strokeDasharray={`${5 / scale},${4 / scale}`}
            />
          ))}

        {layout.placedCuts.map((cut) => {
          const color = colorForPiece(cut.name, cut.originalWidth, cut.originalHeight);
          const isSelected = selectedKey === selectionKey(cut);
          const freed = guideMode ? cut.freedAtStep > 0 && cut.freedAtStep < (stepIndex as number) : true;
          const opacity = guideMode && !freed ? 0.3 : 1;
          const renderedW = cut.width * scale;
          const renderedH = cut.height * scale;
          const showTwoLines = renderedW >= 50 && renderedH >= 40;
          const showOneLine = !showTwoLines && renderedW >= 28 && renderedH >= 18;
          const dims = `${formatMm(cut.originalWidth, cut.unit || 'mm')}×${formatMm(
            cut.originalHeight,
            cut.unit || 'mm'
          )}${unitSymbol(cut.unit || 'mm')}`;

          return (
            <React.Fragment key={`piece-${cut.index}`}>
              <Rect
                x={cut.x}
                y={cut.y}
                width={cut.width}
                height={cut.height}
                rx={2 / scale}
                fill={color}
                opacity={opacity}
                stroke={isSelected ? colors.dark : freed && guideMode ? colors.stepDone : 'rgba(0,0,0,0.28)'}
                strokeWidth={isSelected || (guideMode && freed) ? 3 / scale : 1 / scale}
              />
              {isSelected && (
                <Rect
                  x={cut.x + 2 / scale}
                  y={cut.y + 2 / scale}
                  width={Math.max(0, cut.width - 4 / scale)}
                  height={Math.max(0, cut.height - 4 / scale)}
                  rx={1.5 / scale}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5 / scale}
                  strokeDasharray={`${3 / scale},${3 / scale}`}
                />
              )}
              {showTwoLines && (
                <>
                  <SvgText
                    x={cut.x + cut.width / 2}
                    y={cut.y + cut.height / 2 - fontSizeDims / 2}
                    textAnchor="middle"
                    fontSize={fontSizeName}
                    fontWeight="800"
                    fill="#fff"
                    opacity={opacity}
                    stroke="rgba(0,0,0,0.45)"
                    strokeWidth={strokeW}
                  >
                    {cut.rotated ? '↻ ' : ''}
                    {cut.name}
                  </SvgText>
                  <SvgText
                    x={cut.x + cut.width / 2}
                    y={cut.y + cut.height / 2 + fontSizeDims + 2 / scale}
                    textAnchor="middle"
                    fontSize={fontSizeDims}
                    fontWeight="700"
                    fill="#fff"
                    opacity={opacity}
                    stroke="rgba(0,0,0,0.45)"
                    strokeWidth={strokeW}
                  >
                    {dims}
                  </SvgText>
                </>
              )}
              {showOneLine && (
                <SvgText
                  x={cut.x + cut.width / 2}
                  y={cut.y + cut.height / 2 + fontSizeDims / 3}
                  textAnchor="middle"
                  fontSize={fontSizeDims}
                  fontWeight="800"
                  fill="#fff"
                  opacity={opacity}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth={strokeW}
                >
                  {dims}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* --- Modo guía: panel resaltado + cortes hechos + corte actual --- */}
        {guideMode && activeStep && (
          <Rect
            x={activeStep.panel.x}
            y={activeStep.panel.y}
            width={activeStep.panel.w}
            height={activeStep.panel.h}
            fill={colors.stepPanelFill}
            stroke={colors.stepPanelStroke}
            strokeWidth={2.4 / scale}
            strokeDasharray={`${7 / scale},${5 / scale}`}
          />
        )}

        {guideMode &&
          doneSteps.map((step) => {
            const isH = step.orientation === 'horizontal';
            return (
              <Line
                key={`done-${step.order}`}
                x1={isH ? step.from : step.position}
                y1={isH ? step.position : step.from}
                x2={isH ? step.to : step.position}
                y2={isH ? step.position : step.to}
                stroke={colors.stepDone}
                strokeWidth={2.4 / scale}
                opacity={0.85}
              />
            );
          })}

        {guideMode && activeStep && (
          <>
            <Line
              x1={activeStep.orientation === 'horizontal' ? activeStep.from : activeStep.position}
              y1={activeStep.orientation === 'horizontal' ? activeStep.position : activeStep.from}
              x2={activeStep.orientation === 'horizontal' ? activeStep.to : activeStep.position}
              y2={activeStep.orientation === 'horizontal' ? activeStep.position : activeStep.to}
              stroke={colors.stepActive}
              strokeWidth={4.5 / scale}
            />
            <Circle
              cx={
                activeStep.orientation === 'horizontal'
                  ? (activeStep.from + activeStep.to) / 2
                  : activeStep.position
              }
              cy={
                activeStep.orientation === 'horizontal'
                  ? activeStep.position
                  : (activeStep.from + activeStep.to) / 2
              }
              r={11 / scale}
              fill={colors.stepActive}
              stroke="#fff"
              strokeWidth={1.6 / scale}
            />
            <SvgText
              x={
                activeStep.orientation === 'horizontal'
                  ? (activeStep.from + activeStep.to) / 2
                  : activeStep.position
              }
              y={
                (activeStep.orientation === 'horizontal'
                  ? activeStep.position
                  : (activeStep.from + activeStep.to) / 2) +
                4 / scale
              }
              textAnchor="middle"
              fontSize={12 / scale}
              fontWeight="800"
              fill="#fff"
            >
              {activeStep.order}
            </SvgText>
          </>
        )}

        {/* --- Modo plano: todas las líneas juntas --- */}
        {!guideMode &&
          showAllSteps &&
          layout.cutSteps.map((step) => {
            const isH = step.orientation === 'horizontal';
            const x1 = isH ? step.from : step.position;
            const y1 = isH ? step.position : step.from;
            const x2 = isH ? step.to : step.position;
            const y2 = isH ? step.position : step.to;
            const stepColor = isH ? colors.info : colors.primaryDark;
            return (
              <React.Fragment key={`step-${step.order}`}>
                <Line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stepColor}
                  strokeWidth={2.2 / scale}
                  strokeDasharray={`${6 / scale},${4 / scale}`}
                />
                <Circle
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  r={9 / scale}
                  fill={stepColor}
                  stroke="#fff"
                  strokeWidth={1.2 / scale}
                />
                <SvgText
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 + 3.4 / scale}
                  textAnchor="middle"
                  fontSize={10.5 / scale}
                  fontWeight="800"
                  fill="#fff"
                >
                  {step.order}
                </SvgText>
              </React.Fragment>
            );
          })}

        {gLabel && (
          <>
            <Rect
              x={6 / scale}
              y={6 / scale}
              width={54 / scale}
              height={20 / scale}
              rx={4 / scale}
              fill="rgba(38,33,29,0.72)"
            />
            <SvgText
              x={33 / scale}
              y={20 / scale}
              textAnchor="middle"
              fontSize={11 / scale}
              fontWeight="700"
              fill="#fff"
            >
              {gLabel}
            </SvgText>
          </>
        )}
      </Svg>
    </Pressable>
  );
};