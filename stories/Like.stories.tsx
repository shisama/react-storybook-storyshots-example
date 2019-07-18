import React from "react";

import { storiesOf } from "@storybook/react";
import { Like } from "../src/components/Like";

storiesOf("Like", module).add("0", () => (
  <Like count={0} onClick={() => {}} />
)).add("1", () => (
  <Like count={1} onClick={() => {}} />
));
