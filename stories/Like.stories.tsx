import React from "react";

import { Like } from "../src/components/Like";

export default {
  title: 'Like'
};

export const zero = () => <Like count={0} onClick={() => {}} />;
export const one = () => <Like count={1} onClick={() => {}} />;
zero.story = {
  name: '0',
};
one.story = {
  name: '1',
};