import SaladUI from "../index";

/**
 * Global toast function for triggering toasts from JavaScript
 *
 * @example
 * // Simple toast
 * toast("Event has been created")
 *
 * // With description and action
 * toast("Event has been created", {
 *   description: "Sunday, December 03, 2023 at 9:00 AM",
 *   action: {
 *     label: "Undo",
 *     onClick: () => console.log("Undo"),
 *   },
 * })
 *
 * // Different types
 * toast.success("Success!")
 * toast.error("Error!", { description: "Something went wrong" })
 * toast.warning("Warning!")
 * toast.info("Info")
 */
function createToast(title, options = {}) {
  const event = new CustomEvent("salad-ui:toast", {
    detail: {
      id: options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: options.type || "default",
      title,
      description: options.description,
      duration: options.duration,
      dismissible: options.dismissible,
      action: options.action,
    },
  });
  window.dispatchEvent(event);
}

// Create the main toast function with type methods
const toast = Object.assign(createToast, {
  success: (title, options = {}) => createToast(title, { ...options, type: "success" }),
  error: (title, options = {}) => createToast(title, { ...options, type: "error" }),
  warning: (title, options = {}) => createToast(title, { ...options, type: "warning" }),
  info: (title, options = {}) => createToast(title, { ...options, type: "info" }),
});

// Expose globally
window.toast = toast;

/**
 * Sonner - Toast notification component
 */
class Sonner {
  // Static to track if global listeners are already set up
  static instance = null;

  constructor(el, hookContext) {
    this.el = el;
    this.hookContext = hookContext;
    this.toasts = [];
    this.expanded = false;

    // Config from data attributes
    const options = JSON.parse(el.dataset.options || "{}");
    this.duration = options.duration || 4000;
    this.maxToasts = options.maxToasts || 3;
    this.gap = options.gap || 8;

    // Use singleton pattern - only one Sonner instance should handle events
    if (Sonner.instance) {
      Sonner.instance.destroy();
    }
    Sonner.instance = this;

    // Bound handlers for cleanup
    this.boundHandleToast = this.handleToast.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  setupEvents() {
    // Listen for toast events (single handler for both)
    window.addEventListener("phx:salad-ui:toast", this.boundHandleToast);
    window.addEventListener("salad-ui:toast", this.boundHandleToast);
    document.addEventListener("keydown", this.boundHandleKeyDown);

    // Expand/collapse on hover
    this.el.addEventListener("mouseenter", () => this.setExpanded(true));
    this.el.addEventListener("mouseleave", () => this.setExpanded(false));
  }

  destroy() {
    window.removeEventListener("phx:salad-ui:toast", this.boundHandleToast);
    window.removeEventListener("salad-ui:toast", this.boundHandleToast);
    document.removeEventListener("keydown", this.boundHandleKeyDown);

    // Clear all timeouts
    this.toasts.forEach((t) => t.timeoutId && clearTimeout(t.timeoutId));
    this.toasts = [];
  }

  handleToast(e) {
    this.addToast(e.detail);
  }

  handleKeyDown(e) {
    if (e.key === "Escape" && this.toasts.length > 0) {
      this.dismissToast(this.toasts[this.toasts.length - 1].id);
    }
  }

  addToast(data) {
    // Check for duplicate toast ID (prevent double-firing)
    if (this.toasts.some((t) => t.id === data.id)) {
      return;
    }

    const toast = {
      id: data.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: data.type || "default",
      title: data.title,
      description: data.description,
      duration: data.duration ?? this.duration,
      dismissible: data.dismissible ?? true,
      action: data.action,
      element: null,
      timeoutId: null,
      startTime: Date.now(),
    };

    // Create and append element
    toast.element = this.createToastElement(toast);
    this.el.appendChild(toast.element);
    this.toasts.push(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.element.dataset.state = "open";
      this.updateStack();
    });

    // Auto dismiss
    if (toast.duration > 0) {
      toast.timeoutId = setTimeout(() => this.dismissToast(toast.id), toast.duration);
    }

    // Remove oldest if over limit (after adding new one)
    if (this.toasts.length > this.maxToasts) {
      const oldest = this.toasts[0];
      this.dismissToast(oldest.id);
    }
  }

  dismissToast(id) {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index === -1) return;

    const toast = this.toasts[index];
    if (toast.timeoutId) clearTimeout(toast.timeoutId);

    // Remove from array immediately to prevent double-dismiss
    this.toasts.splice(index, 1);

    // Animate out
    toast.element.dataset.state = "closed";

    setTimeout(() => {
      toast.element.remove();
      this.updateStack();
    }, 150);
  }

  setExpanded(expanded) {
    this.expanded = expanded;
    this.el.dataset.expanded = expanded;

    this.toasts.forEach((toast) => {
      if (expanded && toast.timeoutId) {
        clearTimeout(toast.timeoutId);
        toast.remaining = Math.max(0, toast.duration - (Date.now() - toast.startTime));
        toast.timeoutId = null;
      } else if (!expanded && toast.duration > 0 && !toast.timeoutId) {
        toast.startTime = Date.now();
        toast.timeoutId = setTimeout(
          () => this.dismissToast(toast.id),
          toast.remaining ?? toast.duration
        );
      }
    });

    this.updateStack();
  }

  updateStack() {
    const count = this.toasts.length;

    // Get heights of all toasts
    const heights = this.toasts.map((t) => t.element.offsetHeight);

    // Calculate total height for container sizing in expanded mode
    let totalExpandedHeight = 0;
    if (this.expanded) {
      heights.forEach((h, i) => {
        totalExpandedHeight += h + (i < count - 1 ? this.gap : 0);
      });
    }

    this.toasts.forEach((toast, i) => {
      const el = toast.element;
      const fromFront = count - 1 - i; // 0 = front (newest), 1 = behind, etc.

      // Position all toasts absolutely at the bottom
      el.style.position = "absolute";
      el.style.bottom = "0";
      el.style.left = "0";
      el.style.right = "0";

      if (this.expanded) {
        // When expanded, stack toasts upward with gaps
        let offsetFromBottom = 0;
        for (let j = count - 1; j > i; j--) {
          offsetFromBottom += heights[j] + this.gap;
        }
        el.style.transform = `translateY(-${offsetFromBottom}px)`;
        el.style.opacity = "1";
      } else {
        // When collapsed, show as a visual stack
        // Front toast at position 0, others slightly behind and scaled
        const scale = 1 - fromFront * 0.05;
        const translateY = fromFront * -8; // Move up slightly to peek

        el.style.transform = `translateY(${translateY}px) scale(${scale})`;
        el.style.transformOrigin = "bottom center";

        // Fade out toasts further back
        if (fromFront > 2) {
          el.style.opacity = "0";
        } else {
          el.style.opacity = "1";
        }
      }

      el.style.zIndex = String(100 + count - fromFront);
    });

    // Update container height to fit all toasts
    if (this.expanded && count > 0) {
      this.el.style.height = totalExpandedHeight + "px";
    } else if (count > 0) {
      // In collapsed mode, height is just the front toast
      this.el.style.height = heights[count - 1] + "px";
    } else {
      this.el.style.height = "0";
    }
  }

  createToastElement(toast) {
    const div = document.createElement("div");
    div.id = toast.id;
    div.dataset.state = "closed";
    div.dataset.type = toast.type;
    div.setAttribute("role", "alert");

    const colors = {
      default: "border-border",
      success: "border-green-500",
      info: "border-blue-500",
      warning: "border-yellow-500",
      error: "border-red-500",
    };

    div.className = [
      "group pointer-events-auto flex w-full items-start gap-3 rounded-lg bg-popover p-4",
      "border-l-4 shadow-lg ring-1 ring-border/50",
      "transition-all duration-200 ease-out origin-bottom",
      "data-[state=closed]:opacity-0 data-[state=closed]:translate-x-full",
      "data-[state=open]:opacity-100 data-[state=open]:translate-x-0",
      colors[toast.type] || colors.default,
    ].join(" ");

    const icon = this.getIcon(toast.type);

    div.innerHTML = `
      ${icon ? `<span class="${this.getIconColor(toast.type)}">${icon}</span>` : ""}
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-popover-foreground">${this.escape(toast.title)}</p>
        ${toast.description ? `<p class="text-sm text-muted-foreground mt-1">${this.escape(toast.description)}</p>` : ""}
        ${toast.action ? `
          <button type="button" data-action="true" class="mt-2 text-sm font-medium px-3 py-1.5 rounded-md border border-border bg-background hover:bg-accent transition-colors">
            ${this.escape(toast.action.label)}
          </button>
        ` : ""}
      </div>
      ${toast.dismissible ? `
        <button type="button" data-dismiss="true" class="shrink-0 rounded p-1 opacity-50 hover:opacity-100 transition-opacity" aria-label="Dismiss">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      ` : ""}
    `;

    // Dismiss button handler
    const dismissBtn = div.querySelector("[data-dismiss]");
    if (dismissBtn) {
      dismissBtn.onclick = (e) => {
        e.stopPropagation();
        this.dismissToast(toast.id);
      };
    }

    // Action button handler
    const actionBtn = div.querySelector("[data-action]");
    if (actionBtn && toast.action?.onClick) {
      actionBtn.onclick = (e) => {
        e.stopPropagation();
        toast.action.onClick();
        this.dismissToast(toast.id);
      };
    }

    return div;
  }

  getIcon(type) {
    const icons = {
      success: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      info: `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    return icons[type] || null;
  }

  getIconColor(type) {
    const colors = {
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500",
    };
    return colors[type] || "text-foreground";
  }

  escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}

SaladUI.register("sonner", Sonner);

export { toast };
export default Sonner;
