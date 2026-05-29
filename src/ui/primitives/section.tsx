import React from "react";
import { Box, Text } from "ink";
import { CliBanner } from "./cli-banner.js";

interface SectionProps {
  title?: string;
  bannerTitle?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
  bordered?: boolean;
  showTitle?: boolean;
  contentGap?: number;
  compactBanner?: boolean;
}

export function Section({
  title,
  bannerTitle,
  children,
  width,
  height,
  bordered = true,
  showTitle = true,
  contentGap = 1,
  compactBanner = false
}: SectionProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      {...(bordered ? { borderStyle: "round" as const, borderColor: "cyan" as const } : {})}
      paddingX={1}
      paddingY={0}
      alignSelf="flex-start"
      width={width}
      height={height}
    >
      <CliBanner width={width} title={bannerTitle} compact={compactBanner} />
      {showTitle && title ? <Text color="cyanBright">{title}</Text> : null}
      <Box marginTop={showTitle && title ? contentGap : 0} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
}
