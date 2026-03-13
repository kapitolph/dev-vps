import React from "react";
import { Text } from "ink";
import { BRAND_BLUE } from "../theme";

export function Logo() {
  return (
    <Text backgroundColor={BRAND_BLUE} color="#1e1e2e" bold>
      {" ❯❯ nextpay "}
    </Text>
  );
}
