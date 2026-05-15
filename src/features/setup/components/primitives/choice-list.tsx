import React from "react";
import { Box, Text } from "ink";
import { buildChoiceRenderRows, localModelGroupTitle } from "../../presentation/choice-rows.js";
import { padStatusText, statusRowContentWidth } from "../../layout/sizing.js";
import { visibleChoiceWindow } from "../../layout/choice-window.js";
import { type WizardLocale } from "../../../../shared/i18n/wizard/index.js";
import type { SetupStep } from "../../types.js";

interface ChoiceListProps {
  currentStep: SetupStep;
  locale: WizardLocale;
  selectedIndex: number;
  width: number;
  maxVisibleRows: number;
}

export function PlainChoiceList({
  currentStep,
  locale,
  selectedIndex,
  width,
  maxVisibleRows
}: ChoiceListProps): React.ReactElement {
  const contentWidth = statusRowContentWidth(width);
  const selectedChoiceValue = currentStep.choices[selectedIndex]?.value;

  if (currentStep.choiceGroups && currentStep.choiceGroups.length > 0) {
    return (
      <Box flexDirection="column">
        {currentStep.choiceGroups.map((group, groupIndex) => (
          <Box key={group.id} flexDirection="column" {...(groupIndex > 0 ? { marginTop: 1 } : {})}>
            <Text color="cyan">{localModelGroupTitle(locale, group.id)}</Text>
            {group.choices.map((choice) => (
              <Text key={choice.value} color={choice.value === selectedChoiceValue ? "green" : undefined}>
                {choice.value === selectedChoiceValue ? `› ${choice.label}` : `  ${choice.label}`}
              </Text>
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  const rows = buildChoiceRenderRows(currentStep, locale, selectedChoiceValue);
  const selectedRowIndex = Math.max(0, rows.findIndex((row) => row.kind === "choice" && row.choiceValue === selectedChoiceValue));
  const listRowBudget = rows.length > maxVisibleRows ? Math.max(1, maxVisibleRows - 2) : maxVisibleRows;
  const groupHeaderIndex = groupHeaderIndexForChoice(rows, selectedRowIndex);
  const visibleRows = groupHeaderIndex === null
    ? visibleChoiceWindow(rows, selectedRowIndex, listRowBudget)
    : groupedChoiceWindow(rows, groupHeaderIndex, listRowBudget);

  return (
    <Box flexDirection="column">
      {visibleRows.hasHiddenAbove ? <Text color="gray">{padStatusText("↑", contentWidth)}</Text> : null}
      {visibleRows.items.map((row) => (
        row.kind === "gap" ? (
          <Box key={row.key} marginTop={1}>
            <Text>{padStatusText("", contentWidth)}</Text>
          </Box>
        ) : (
          <Text key={row.key} {...(row.color ? { color: row.color } : {})}>
            {padStatusText(row.text, contentWidth)}
          </Text>
        )
      ))}
      {visibleRows.hasHiddenBelow ? <Text color="gray">{padStatusText("↓", contentWidth)}</Text> : null}
    </Box>
  );
}

function groupHeaderIndexForChoice(rows: ReturnType<typeof buildChoiceRenderRows>, choiceRowIndex: number): number | null {
  for (let index = choiceRowIndex - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (!row) {
      continue;
    }
    if (row.kind === "group") {
      return index;
    }
    if (row.kind === "choice") {
      return null;
    }
  }

  return null;
}

function groupedChoiceWindow(
  rows: ReturnType<typeof buildChoiceRenderRows>,
  groupHeaderIndex: number,
  maxVisible: number
) {
  const startIndex = groupHeaderIndex;
  const items = rows.slice(startIndex, startIndex + maxVisible);

  return {
    items,
    startIndex,
    hasHiddenAbove: startIndex > 0,
    hasHiddenBelow: startIndex + maxVisible < rows.length
  };
}
