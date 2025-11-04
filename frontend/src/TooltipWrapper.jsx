import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

const TooltipWrapper = ({ children, content, shortcut, side = "bottom" }) => {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700 max-w-xs z-50"
            sideOffset={5}
            side={side}
          >
            <div className="flex flex-col gap-1">
              <span>{content}</span>
              {shortcut && (
                <span className="text-slate-400 text-xs">
                  {shortcut}
                </span>
              )}
            </div>
            <Tooltip.Arrow className="fill-slate-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default TooltipWrapper;