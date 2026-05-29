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
    const showGroupGaps = shouldShowGroupGaps(currentStep.choiceGroups, maxVisibleRows);
    const visibleGroups = visibleGroupedChoices(currentStep.choiceGroups, selectedChoiceValue, maxVisibleRows, showGroupGaps);

    return (
      <Box flexDirection="column">
        {visibleGroups.map((group, groupIndex) => (
          <Box key={group.id} flexDirection="column" {...(showGroupGaps && groupIndex > 0 ? { marginTop: 1 } : {})}>
            <Text color="cyan">{padStatusText(localModelGroupTitle(locale, group.id), contentWidth)}</Text>
            {group.choices.map((choice) => (
              <Text key={choice.value} color={choice.value === selectedChoiceValue ? "green" : undefined}>
                {padStatusText(choice.value === selectedChoiceValue ? `› ${choice.label}` : `  ${choice.label}`, contentWidth)}
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

function visibleGroupedChoices(
  groups: NonNullable<SetupStep["choiceGroups"]>,
  selectedChoiceValue: string | undefined,
  maxVisibleRows: number,
  showGroupGaps: boolean
) {
  const headerRows = groups.length;
  const gapRows = showGroupGaps ? Math.max(0, groups.length - 1) : 0;
  const choiceBudget = Math.max(0, maxVisibleRows - headerRows - gapRows);
  const selectedGroup = groups.find((group) => group.choices.some((choice) => choice.value === selectedChoiceValue)) ?? groups[0];
  const allocations = new Map(groups.map((group) => [group.id, 0]));
  let remaining = choiceBudget;

  if (selectedGroup && remaining > 0) {
    allocations.set(selectedGroup.id, 1);
    remaining -= 1;
  }

  for (const group of groups) {
    if (remaining <= 0) {
      break;
    }
    if (group.id === selectedGroup?.id || group.choices.length === 0) {
      continue;
    }
    allocations.set(group.id, 1);
    remaining -= 1;
  }

  while (remaining > 0) {
    const nextGroup = groups.find((group) => (allocations.get(group.id) ?? 0) < group.choices.length);
    if (!nextGroup) {
      break;
    }
    allocations.set(nextGroup.id, (allocations.get(nextGroup.id) ?? 0) + 1);
    remaining -= 1;
  }

  return groups.map((group) => {
    const visibleCount = allocations.get(group.id) ?? 0;
    const selectedIndex = group.choices.findIndex((choice) => choice.value === selectedChoiceValue);
    const startIndex = selectedIndex >= 0
      ? clamp(selectedIndex - Math.floor(visibleCount / 2), 0, Math.max(0, group.choices.length - visibleCount))
      : 0;

    return {
      id: group.id,
      choices: visibleCount > 0 ? group.choices.slice(startIndex, startIndex + visibleCount) : []
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function shouldShowGroupGaps(
  groups: NonNullable<SetupStep["choiceGroups"]>,
  maxVisibleRows: number
): boolean {
  const headerRows = groups.length;
  const gapRows = Math.max(0, groups.length - 1);
  const totalChoiceRows = groups.reduce((total, group) => total + group.choices.length, 0);

  if (maxVisibleRows >= headerRows + gapRows + totalChoiceRows) {
    return true;
  }

  return maxVisibleRows >= headerRows + gapRows + 1;
}
