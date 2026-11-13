// Shared UI Component Library for SENTRAVAX
// Supporting Light Family (Public Website & User Portal) and Dark Family (Admin & Intelligence)

// 1. Button
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, UITheme } from './Button';

// 2. Badge & Data Provenance
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, DataFreshnessStatus } from './Badge';

// 3. Card & Card Structure
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  CardPadding,
} from './Card';

// 4. Form Controls
export {
  Label,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
} from './FormControls';
export type {
  LabelProps,
  FormErrorMessageProps,
  InputProps,
  SelectProps,
  SelectOption,
  TextareaProps,
  CheckboxProps,
  RadioProps,
} from './FormControls';

// 5. Modal / Dialog
export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

// 6. Tabs & Navigation
export { Tabs, TabPanel } from './Tabs';
export type { TabsProps, TabPanelProps, TabItem, TabsVariant } from './Tabs';

// 7. Skeleton / Loading States
export { Skeleton } from './Skeleton';
export type { SkeletonProps, SkeletonVariant } from './Skeleton';

// 8. EmptyState
export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './EmptyState';

