import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';

type Props = {
  count: number;
  onClick: React.MouseEventHandler;
};

export const Like = ({ count, onClick }: Props) => {
  return (
    <>
      <div onClick={onClick}>
        <FontAwesomeIcon icon={faHeart} />
        {count}
      </div>
    </>
  );
};
