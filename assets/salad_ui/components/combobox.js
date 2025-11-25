// saladui/components/combobox.js
import Component from "../core/component";
import SaladUI from "../index";

/**
 * ComboboxItem class to manage individual combobox options
 */
class ComboboxItem {
  constructor(element, parent) {
    this.el = element;
    this.parent = parent;
    this.value = element.dataset.value;
    this.disabled = element.dataset.disabled === "true";
    this.label = element.textContent.trim();
    this.indicator = element.querySelector("[data-part='item-indicator']");
    this.visible = true;
    this.selected = false;
    this.highlighted = false;

    this.setupEvents();
  }

  setupEvents() {
    this.el.addEventListener("click", this.handleClick.bind(this));
    this.el.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
  }

  handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.parent.selectItem(this);
    }
  }

  handleMouseEnter() {
    if (!this.disabled && this.visible) {
      this.parent.highlightItem(this);
    }
  }

  setSelected(selected) {
    this.selected = selected;
    if (this.indicator) {
      this.indicator.hidden = !selected;
    }
    this.el.setAttribute("aria-selected", selected ? "true" : "false");
  }

  setHighlighted(highlighted) {
    this.highlighted = highlighted;
    this.el.setAttribute("data-highlighted", highlighted ? "true" : "false");
    if (highlighted) {
      this.el.scrollIntoView({ block: "nearest" });
    }
  }

  setVisible(visible) {
    this.visible = visible;
    this.el.setAttribute("data-visible", visible ? "true" : "false");
  }

  matchesQuery(query) {
    if (!query) return true;
    return this.label.toLowerCase().includes(query.toLowerCase());
  }

  destroy() {
    this.el.removeEventListener("click", this.handleClick);
    this.el.removeEventListener("mouseenter", this.handleMouseEnter);
  }
}

/**
 * ComboboxComponent - searchable select dropdown
 */
class ComboboxComponent extends Component {
  constructor(el, hookContext) {
    super(el, { hookContext });

    this.trigger = this.getPart("trigger");
    this.valueDisplay = this.getPart("value");
    this.content = this.getPart("content");
    this.input = this.getPart("input");
    this.list = this.getPart("list");
    this.empty = this.getPart("empty");

    this.disabled = this.el.dataset.disabled === "true";
    this.placeholder = this.options.placeholder || "Select...";
    this.emptyMessage = this.options.emptyMessage || "No results found.";

    this.selectedValue = this.options.value || this.options.defaultValue || null;
    this.highlightedIndex = -1;

    this.initializeItems();
    this.updateValueDisplay();

    this.config.preventDefaultKeys = [
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "Enter",
      " ",
      "Escape",
    ];

    this.handleInputChange = this.handleInputChange.bind(this);
    this.input.addEventListener("input", this.handleInputChange);
  }

  getComponentConfig() {
    return {
      stateMachine: {
        closed: {
          enter: "onClosedEnter",
          transitions: {
            open: "open",
            toggle: "open",
          },
        },
        open: {
          enter: "onOpenEnter",
          exit: "onOpenExit",
          transitions: {
            close: "closed",
            toggle: "closed",
            select: "closed",
          },
        },
      },
      events: {
        closed: {
          keyMap: {
            ArrowDown: "open",
            ArrowUp: "open",
            Enter: "open",
            " ": "open",
          },
          mouseMap: {
            trigger: {
              click: "toggle",
            },
          },
        },
        open: {
          keyMap: {
            Escape: "close",
            ArrowUp: () => this.navigateItems("prev"),
            ArrowDown: () => this.navigateItems("next"),
            Home: () => this.navigateItems("first"),
            End: () => this.navigateItems("last"),
            Enter: () => this.selectHighlightedItem(),
          },
        },
      },
      hiddenConfig: {
        closed: {
          content: true,
        },
        open: {
          content: false,
        },
      },
      ariaConfig: {
        trigger: {
          all: {
            haspopup: "listbox",
          },
          open: {
            expanded: "true",
          },
          closed: {
            expanded: "false",
          },
        },
        content: {
          all: {
            role: "listbox",
          },
        },
        item: {
          all: {
            role: "option",
          },
        },
      },
    };
  }

  initializeItems() {
    const itemElements = Array.from(
      this.el.querySelectorAll("[data-part='item']")
    );

    this.items = itemElements.map((el) => new ComboboxItem(el, this));
    this.groups = this.getAllParts("group");

    if (this.selectedValue) {
      const selectedItem = this.items.find(
        (item) => item.value === this.selectedValue
      );
      if (selectedItem) {
        selectedItem.setSelected(true);
      }
    }
  }

  onOpenEnter() {
    this.input.value = "";
    this.filterItems("");
    this.highlightFirstItem();

    requestAnimationFrame(() => {
      this.input.focus();
    });

    this.setupOutsideClickHandler();
    this.pushEvent("opened");
  }

  onOpenExit() {
    this.removeOutsideClickHandler();
  }

  onClosedEnter() {
    this.syncHiddenInput();
    this.pushEvent("closed");
  }

  setupOutsideClickHandler() {
    this.outsideClickHandler = (event) => {
      if (!this.el.contains(event.target)) {
        this.transition("close");
      }
    };
    document.addEventListener("click", this.outsideClickHandler, true);
  }

  removeOutsideClickHandler() {
    if (this.outsideClickHandler) {
      document.removeEventListener("click", this.outsideClickHandler, true);
      this.outsideClickHandler = null;
    }
  }

  handleInputChange() {
    const query = this.input.value.trim();
    this.filterItems(query);
  }

  filterItems(query) {
    let visibleCount = 0;

    this.items.forEach((item) => {
      const matches = item.matchesQuery(query);
      item.setVisible(matches);
      if (matches) visibleCount++;
    });

    this.groups.forEach((group) => {
      const groupItems = group.querySelector("[data-part='group-items']");
      if (groupItems) {
        const visibleItems = groupItems.querySelectorAll(
          "[data-part='item'][data-visible='true']"
        );
        group.style.display = visibleItems.length > 0 ? "" : "none";
      }
    });

    if (this.empty) {
      this.empty.setAttribute(
        "data-visible",
        visibleCount === 0 ? "true" : "false"
      );
    }

    this.highlightFirstItem();
  }

  get visibleItems() {
    return this.items.filter((item) => item.visible && !item.disabled);
  }

  highlightFirstItem() {
    const visible = this.visibleItems;
    if (visible.length > 0) {
      this.highlightItem(visible[0]);
    } else {
      this.highlightedIndex = -1;
      this.items.forEach((item) => item.setHighlighted(false));
    }
  }

  highlightItem(item) {
    this.items.forEach((i) => i.setHighlighted(false));
    item.setHighlighted(true);
    this.highlightedIndex = this.visibleItems.indexOf(item);
  }

  navigateItems(direction) {
    const visible = this.visibleItems;
    if (visible.length === 0) return;

    let newIndex;
    switch (direction) {
      case "next":
        newIndex =
          this.highlightedIndex < visible.length - 1
            ? this.highlightedIndex + 1
            : 0;
        break;
      case "prev":
        newIndex =
          this.highlightedIndex > 0
            ? this.highlightedIndex - 1
            : visible.length - 1;
        break;
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = visible.length - 1;
        break;
      default:
        return;
    }

    this.highlightItem(visible[newIndex]);
  }

  selectHighlightedItem() {
    const visible = this.visibleItems;
    if (this.highlightedIndex >= 0 && this.highlightedIndex < visible.length) {
      this.selectItem(visible[this.highlightedIndex]);
    }
  }

  selectItem(item) {
    // If clicking on the already selected item, deselect it
    if (this.selectedValue === item.value) {
      item.setSelected(false);
      this.selectedValue = null;
    } else {
      // Deselect all items first
      this.items.forEach((i) => i.setSelected(false));
      // Select the new item
      item.setSelected(true);
      this.selectedValue = item.value;
    }

    this.updateValueDisplay();
    this.transition("select");

    this.pushEvent("value-changed", { value: this.selectedValue });
  }

  updateValueDisplay() {
    if (!this.valueDisplay) return;

    if (this.selectedValue) {
      const selectedItem = this.items.find(
        (item) => item.value === this.selectedValue
      );
      if (selectedItem) {
        this.valueDisplay.setAttribute("data-content", selectedItem.label);
      }
    } else {
      this.valueDisplay.setAttribute("data-content", this.placeholder);
    }
  }

  syncHiddenInput() {
    const existingInputs = this.el.querySelectorAll("input[type='hidden']");
    existingInputs.forEach((input) => input.remove());

    const name = this.options.name;
    if (name && this.selectedValue) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = this.selectedValue;
      this.el.appendChild(input);
    }
  }

  beforeDestroy() {
    this.removeOutsideClickHandler();
    this.input.removeEventListener("input", this.handleInputChange);
    this.items.forEach((item) => item.destroy());
    this.items = [];
  }
}

SaladUI.register("combobox", ComboboxComponent);

export default ComboboxComponent;
