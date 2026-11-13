import React, { useRef } from 'react';
import { cn } from '../../lib/utils';
import type { UITheme } from './Button';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export type TabsVariant = 'underline' | 'pills';

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: TabsVariant;
  theme?: UITheme;
  className?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  theme = 'light',
  className,
  children,
}) => {
  const isDark = theme === 'dark';
  const tabListRef = useRef<HTMLDivElement>(null);

  // Keyboard Navigation: Arrow Left, Arrow Right, Home, End
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.id === tabs[index]?.id);

    let nextTabId: string | null = null;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % enabledTabs.length;
      nextTabId = enabledTabs[nextIndex]?.id ?? null;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      nextTabId = enabledTabs[prevIndex]?.id ?? null;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextTabId = enabledTabs[0]?.id ?? null;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextTabId = enabledTabs[enabledTabs.length - 1]?.id ?? null;
    }

    if (nextTabId) {
      onChange(nextTabId);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      const targetIndex = tabs.findIndex((t) => t.id === nextTabId);
      buttons?.[targetIndex]?.focus();
    }
  };

  const getContainerStyles = (): string => {
    if (variant === 'pills') {
      return isDark
        ? 'p-1 rounded-xl bg-[#1C1C1C] border border-[#2C2C2C] inline-flex'
        : 'p-1 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] inline-flex';
    }
    // Underline
    return isDark
      ? 'border-b border-[#2C2C2C] flex'
      : 'border-b border-[#E5E7EB] flex';
  };

  const getTabStyles = (tab: TabItem, isActive: boolean): string => {
    if (tab.disabled) {
      return 'opacity-40 cursor-not-allowed';
    }

    if (variant === 'pills') {
      if (isActive) {
        return isDark
          ? 'bg-[#2B2B2B] text-white shadow-xs font-bold'
          : 'bg-white text-[#111827] shadow-xs font-bold';
      }
      return isDark
        ? 'text-[#8A8A8A] hover:text-[#D4D4D4] hover:bg-[#222222]'
        : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB]';
    }

    // Underline variant
    if (isActive) {
      return isDark
        ? 'border-b-2 border-[#F59E0B] text-[#F59E0B] font-bold pb-2.5 -mb-px'
        : 'border-b-2 border-[#047857] text-[#047857] font-bold pb-2.5 -mb-px';
    }
    return isDark
      ? 'border-b-2 border-transparent text-[#8A8A8A] hover:text-[#D4D4D4] hover:border-[#3D3D3D] pb-2.5 -mb-px'
      : 'border-b-2 border-transparent text-[#4B5563] hover:text-[#111827] hover:border-[#D1D5DB] pb-2.5 -mb-px';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation List */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation="horizontal"
        className={cn('gap-1 overflow-x-auto no-scrollbar', getContainerStyles())}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              aria-disabled={tab.disabled ? true : undefined}
              onClick={() => !tab.disabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                'inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm transition-all rounded-lg select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 shrink-0',
                isDark ? 'focus-visible:ring-[#F59E0B]' : 'focus-visible:ring-[#047857]',
                getTabStyles(tab, isActive)
              )}
            >
              {tab.icon && <span className="shrink-0" aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold',
                    isActive
                      ? isDark
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        : 'bg-[#ECFDF5] text-[#047857]'
                      : isDark
                      ? 'bg-[#222222] text-[#A3A3A3]'
                      : 'bg-[#E5E7EB] text-[#374151]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {children && <div className="pt-4">{children}</div>}
    </div>
  );
};

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  activeTab: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, activeTab, children, className, ...props }) => {
  if (id !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={cn('outline-none animate-in fade-in-50 duration-150 motion-reduce:animate-none', className)}
      {...props}
    >
      {children}
    </div>
  );
};

Tabs.displayName = 'Tabs';
TabPanel.displayName = 'TabPanel';

