import React from 'react';
import { RiCloseFill } from 'react-icons/ri';

type PropTypes = {
  width?: string;
  height?: string;
  children: any;
  title?: string;
  onClose?: () => void;
};

const Dialog: React.FC<PropTypes> = ({
  children,
  title,
  height,
  width = 'm-4 lg:w-2/4 w-3/4',
  onClose,
}) => {
  return (
    <div className="bg-primary/60  fixed left-0 top-0 z-50 flex size-full items-center justify-center">
      <div
        className={`absolute inset-0 z-30 size-full`}
        onClick={() => {
          onClose?.();
        }}
      />
      <div
        className={`${height} ${width} z-50 max-h-[90%] bg-white p-4 shadow-2xl`}
      >
        <div className="mb-8 flex flex-row items-center justify-between">
          <h2 className="text-primary text-lg font-bold">{title}</h2>
          <div
            className="text-primary ml-auto flex h-[25px] w-[50px] cursor-pointer flex-row justify-center text-center"
            onClick={() => {
              onClose?.();
            }}
          >
            <RiCloseFill width={20} className="text-primary" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Dialog;
