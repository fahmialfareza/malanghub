import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { cx } from "./cx";

export type ModalProps = {
  open: boolean;
  onClose(): void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Tints the header for destructive confirmations. */
  danger?: boolean;
  /**
   * Set for dialogs that host widgets rendering popups outside the dialog
   * (TinyMCE menus/dialogs). Headless UI makes everything outside the panel
   * inert, which would block them, so a lighter modal is used instead.
   */
  allowExternalPopups?: boolean;
};

const modalSizes = {
  sm: "tw:max-w-md",
  md: "tw:max-w-lg",
  lg: "tw:max-w-3xl",
  xl: "tw:max-w-5xl",
};

/**
 * Accessible modal (focus trap, Escape, backdrop click) replacing the
 * Bootstrap/jQuery `.modal()` dialogs.
 */
const backdropClass =
  "tw:fixed tw:inset-0 tw:bg-overlay tw:backdrop-blur-[2px] tw:transition-opacity tw:duration-200 tw:data-closed:opacity-0";
const positionerClass =
  "tw:flex tw:min-h-full tw:items-end tw:justify-center tw:p-3 tw:sm:items-center tw:sm:p-6";
const panelClass = (size: NonNullable<ModalProps["size"]>) =>
  cx(
    "tw:flex tw:max-h-[calc(100dvh-1.5rem)] tw:w-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-line tw:bg-surface tw:text-body tw:shadow-pop tw:transition tw:duration-200 tw:data-closed:translate-y-3 tw:data-closed:opacity-0 tw:sm:max-h-[calc(100dvh-3rem)]",
    modalSizes[size]
  );
const headerClass = (danger?: boolean) =>
  cx(
    "tw:flex tw:items-center tw:justify-between tw:gap-4 tw:border-b tw:border-line tw:px-5 tw:py-4",
    danger && "tw:bg-danger-soft"
  );
const titleClass = (danger?: boolean) =>
  cx(
    "tw:m-0 tw:font-heading tw:text-lg tw:font-semibold",
    danger ? "tw:text-danger" : "tw:text-fg"
  );

const CloseButton = ({ onClose }: { onClose(): void }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Tutup"
    className="tw:-mr-1 tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-lg tw:border-0 tw:bg-transparent tw:text-xl tw:text-muted tw:transition-colors tw:hover:bg-surface-2 tw:hover:text-fg tw:focus-visible:outline-none tw:focus-visible:ring-4 tw:focus-visible:ring-ring"
  >
    <span aria-hidden>×</span>
  </button>
);

const ModalBody = ({
  children,
  footer,
}: Pick<ModalProps, "children" | "footer">) => (
  <>
    <div className="tw:overflow-y-auto tw:px-5 tw:py-5">{children}</div>
    {footer && (
      <div className="tw:flex tw:flex-wrap tw:justify-end tw:gap-2 tw:border-t tw:border-line tw:bg-surface-2/40 tw:px-5 tw:py-3.5">
        {footer}
      </div>
    )}
  </>
);

/** Modal without Headless UI's inert-outside behavior; see `allowExternalPopups`. */
const LightModal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  danger,
}: ModalProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="tw:relative tw:z-[1060]">
      <div className={backdropClass} aria-hidden />
      <div
        className="tw:fixed tw:inset-0 tw:overflow-y-auto"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className={positionerClass}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cx(panelClass(size), "tw:focus:outline-none")}
          >
            <div className={headerClass(danger)}>
              <h2 id={titleId} className={titleClass(danger)}>
                {title}
              </h2>
              <CloseButton onClose={onClose} />
            </div>
            <ModalBody footer={footer}>{children}</ModalBody>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const Modal = (props: ModalProps) => {
  const { open, onClose, title, children, footer, size = "md", danger } = props;

  if (props.allowExternalPopups) return <LightModal {...props} />;

  return (
    <Dialog open={open} onClose={onClose} className="tw:relative tw:z-[1060]">
      <DialogBackdrop transition className={backdropClass} />
      <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
        <div className={positionerClass}>
          <DialogPanel transition className={panelClass(size)}>
            <div className={headerClass(danger)}>
              <DialogTitle as="h2" className={titleClass(danger)}>
                {title}
              </DialogTitle>
              <CloseButton onClose={onClose} />
            </div>
            <ModalBody footer={footer}>{children}</ModalBody>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export type DropdownItem = {
  key: string;
  label: React.ReactNode;
  href?: string;
  onSelect?: () => void;
};

/**
 * Dropdown menu. `renderLink` lets each app supply its router link
 * (next/link on the web, the adapter link in the native shell).
 */
export const Dropdown = ({
  label,
  items,
  renderLink,
  buttonClassName,
  align = "left",
  footer,
}: {
  label: React.ReactNode;
  items: DropdownItem[];
  renderLink: (props: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => React.ReactElement;
  buttonClassName?: string;
  align?: "left" | "right";
  footer?: React.ReactNode;
}) => (
  <Menu as="div" className="tw:relative">
    <MenuButton className={buttonClassName}>{label}</MenuButton>
    <MenuItems
      transition
      modal={false}
      className={cx(
        "tw:absolute tw:z-[1050] tw:mt-2 tw:max-h-[70vh] tw:min-w-56 tw:overflow-y-auto tw:rounded-xl tw:border tw:border-line tw:bg-surface tw:p-1.5 tw:shadow-pop tw:transition tw:duration-150 tw:focus:outline-none tw:data-closed:-translate-y-1 tw:data-closed:opacity-0",
        align === "right" ? "tw:right-0" : "tw:left-0"
      )}
    >
      {items.map((item) => {
        const itemClass =
          "tw:block tw:w-full tw:rounded-lg tw:border-0 tw:bg-transparent tw:px-3 tw:py-2 tw:text-left tw:text-[0.95rem] tw:font-medium tw:text-body tw:no-underline tw:data-focus:bg-surface-2 tw:data-focus:text-fg";
        return (
          <MenuItem key={item.key}>
            {item.href
              ? renderLink({
                  href: item.href,
                  className: itemClass,
                  children: item.label,
                })
              : (
                  <button
                    type="button"
                    className={itemClass}
                    onClick={item.onSelect}
                  >
                    {item.label}
                  </button>
                )}
          </MenuItem>
        );
      })}
      {footer}
    </MenuItems>
  </Menu>
);

/** Expand/collapse section, replacing Bootstrap's collapse plugin. */
export const Collapse = ({
  title,
  defaultOpen,
  children,
  buttonClassName,
  panelClassName,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
}) => (
  <Disclosure defaultOpen={defaultOpen}>
    {({ open }) => (
      <>
        <DisclosureButton
          className={cx(
            "tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-3 tw:border-0 tw:bg-transparent tw:text-left",
            buttonClassName
          )}
        >
          {title}
          <span
            aria-hidden
            className={cx(
              "fa fa-angle-down tw:transition-transform",
              open && "tw:rotate-180"
            )}
          />
        </DisclosureButton>
        <DisclosurePanel className={panelClassName}>{children}</DisclosurePanel>
      </>
    )}
  </Disclosure>
);
