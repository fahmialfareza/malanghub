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
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/**
 * Accessible modal (focus trap, Escape, backdrop click) replacing the
 * Bootstrap/jQuery `.modal()` dialogs.
 */
const backdropClass =
  "fixed inset-0 bg-overlay backdrop-blur-[2px] transition-opacity duration-200 data-closed:opacity-0";
const positionerClass =
  "flex min-h-full items-end justify-center p-3 sm:items-center sm:p-6";
const panelClass = (size: NonNullable<ModalProps["size"]>) =>
  cx(
    "flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-body shadow-pop transition duration-200 data-closed:translate-y-3 data-closed:opacity-0 sm:max-h-[calc(100dvh-3rem)]",
    modalSizes[size]
  );
const headerClass = (danger?: boolean) =>
  cx(
    "flex items-center justify-between gap-4 border-b border-line px-5 py-4",
    danger && "bg-danger-soft"
  );
const titleClass = (danger?: boolean) =>
  cx(
    "m-0 font-heading text-lg font-semibold",
    danger ? "text-danger" : "text-fg"
  );

const CloseButton = ({ onClose }: { onClose(): void }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Tutup"
    className="-mr-1 flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
  >
    <span aria-hidden>×</span>
  </button>
);

const ModalBody = ({
  children,
  footer,
}: Pick<ModalProps, "children" | "footer">) => (
  <>
    <div className="overflow-y-auto px-5 py-5">{children}</div>
    {footer && (
      <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/40 px-5 py-3.5">
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
    <div className="relative z-[1060]">
      <div className={backdropClass} aria-hidden />
      <div
        className="fixed inset-0 overflow-y-auto"
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
            className={cx(panelClass(size), "focus:outline-none")}
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
    <Dialog open={open} onClose={onClose} className="relative z-[1060]">
      <DialogBackdrop transition className={backdropClass} />
      <div className="fixed inset-0 overflow-y-auto">
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
  <Menu as="div" className="relative">
    <MenuButton className={buttonClassName}>{label}</MenuButton>
    <MenuItems
      transition
      modal={false}
      className={cx(
        "absolute z-[1050] mt-2 max-h-[70vh] min-w-56 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop transition duration-150 focus:outline-none data-closed:-translate-y-1 data-closed:opacity-0",
        align === "right" ? "right-0" : "left-0"
      )}
    >
      {items.map((item) => {
        const itemClass =
          "block w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left text-[0.95rem] font-medium text-body no-underline data-focus:bg-surface-2 data-focus:text-fg";
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
            "flex w-full items-center justify-between gap-3 border-0 bg-transparent text-left",
            buttonClassName
          )}
        >
          {title}
          <span
            aria-hidden
            className={cx(
              "fa fa-angle-down transition-transform",
              open && "rotate-180"
            )}
          />
        </DisclosureButton>
        <DisclosurePanel className={panelClassName}>{children}</DisclosurePanel>
      </>
    )}
  </Disclosure>
);
