import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const AccordionContext = createContext({});

export function Accordion({ type, collapsible, className, children }) {
  const [openItem, setOpenItem] = useState(null);

  const handleToggle = (value) => {
    if (collapsible && openItem === value) {
      setOpenItem(null);
    } else {
      setOpenItem(value);
    }
  };

  return (
    <AccordionContext.Provider value={{ openItem, handleToggle }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, className, children }) {
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({ className, children, value }) {
  const { openItem, handleToggle } = useContext(AccordionContext);
  const isOpen = openItem === value;

  return (
    <button
      className={`flex flex-1 items-center justify-between w-full font-medium transition-all [&[data-state=open]>svg]:rotate-180 ${className || ''}`}
      onClick={() => handleToggle(value)}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
}

export function AccordionContent({ className, children, value }) {
  const { openItem } = useContext(AccordionContext);
  const isOpen = openItem === value;

  if (!isOpen) return null;

  return (
    <div
      className={`overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down ${className || ''}`}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <div className="pt-0">{children}</div>
    </div>
  );
}
