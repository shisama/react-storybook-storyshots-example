import React from "react";
import { Like } from "./Like";

type Props = {};

export const App: React.FC<Props> = props => {
  const [count, setCount] = React.useState(0);
  const onClick = () => {
    setCount(count + 1);
  }
  return (
    <div>
      <Like {...{count, onClick}}/>
    </div>
  )
}
