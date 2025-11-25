defmodule SaladUI.Combobox do
  @moduledoc """
  Combobox component - a searchable select dropdown.

  Combines the features of a select dropdown with text input filtering,
  similar to shadcn/ui's Combobox component.

  ## Example

      <.combobox id="framework-select" placeholder="Select framework..." on-value-changed="framework_selected">
        <.combobox_item value="react">React</.combobox_item>
        <.combobox_item value="vue">Vue</.combobox_item>
        <.combobox_item value="angular">Angular</.combobox_item>
        <.combobox_item value="svelte">Svelte</.combobox_item>
      </.combobox>

  ## With groups

      <.combobox id="fruit-select" placeholder="Select fruit...">
        <.combobox_group label="Citrus">
          <.combobox_item value="orange">Orange</.combobox_item>
          <.combobox_item value="lemon">Lemon</.combobox_item>
        </.combobox_group>
        <.combobox_group label="Berries">
          <.combobox_item value="strawberry">Strawberry</.combobox_item>
          <.combobox_item value="blueberry">Blueberry</.combobox_item>
        </.combobox_group>
      </.combobox>
  """
  use SaladUI, :component

  import SaladUI.Icon

  attr :id, :string, required: true
  attr :name, :any, default: nil
  attr :value, :any, default: nil, doc: "The current value of the combobox"
  attr :"default-value", :any, default: nil, doc: "The default value of the combobox"
  attr :placeholder, :string, default: "Select...", doc: "Placeholder text for the search input"
  attr :"empty-message", :string, default: "No results found.", doc: "Message shown when no items match"
  attr :disabled, :boolean, default: false
  attr :class, :string, default: nil

  attr :field, Phoenix.HTML.FormField,
    doc: "A form field struct retrieved from the form, for example: @form[:framework]"

  attr :"on-value-changed", :any, default: nil, doc: "Handler for value changed event"
  attr :"on-open", :any, default: nil, doc: "Handler for combobox open event"
  attr :"on-close", :any, default: nil, doc: "Handler for combobox close event"

  attr :rest, :global
  slot :inner_block, required: true

  def combobox(assigns) do
    assigns = prepare_assign(assigns)

    event_map =
      %{}
      |> add_event_mapping(assigns, "value-changed", :"on-value-changed")
      |> add_event_mapping(assigns, "opened", :"on-open")
      |> add_event_mapping(assigns, "closed", :"on-close")

    assigns =
      assigns
      |> assign(:event_map, json(event_map))
      |> assign(
        :options,
        json(%{
          defaultValue: assigns[:"default-value"],
          value: assigns.value,
          name: assigns.name,
          placeholder: assigns.placeholder,
          emptyMessage: assigns[:"empty-message"],
          disabled: assigns.disabled,
          animations: get_animation_config()
        })
      )

    ~H"""
    <div
      id={@id}
      class={classes(["relative inline-flex", @class])}
      data-part="root"
      data-component="combobox"
      data-state="closed"
      data-options={@options}
      data-event-mappings={@event_map}
      data-disabled={@disabled}
      phx-hook="SaladUI"
      {@rest}
    >
      <button
        type="button"
        data-part="trigger"
        disabled={@disabled}
        class={
          classes([
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "hover:bg-accent/50"
          ])
        }
      >
        <span
          data-part="value"
          class="select-value pointer-events-none truncate before:content-[attr(data-content)]"
          data-content={@placeholder}
          data-placeholder={@placeholder}
        >
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="ml-2 h-4 w-4 shrink-0 opacity-50"
        >
          <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
        </svg>
      </button>

      <div
        data-part="content"
        hidden
        class={
          classes([
            "absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2"
          ])
        }
      >
        <div data-part="input-wrapper" class="flex items-center border-b px-3">
          <.icon name="hero-magnifying-glass" class="h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            data-part="input"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder={@placeholder}
            class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-transparent"
          />
        </div>

        <div data-part="empty" data-visible="false" class="py-6 text-center text-sm data-[visible=false]:hidden">
          {assigns[:"empty-message"]}
        </div>

        <div data-part="list" class="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
          {render_slot(@inner_block)}
        </div>
      </div>
    </div>
    """
  end

  attr :label, :string, required: true
  attr :class, :string, default: nil
  slot :inner_block, required: true

  def combobox_group(assigns) do
    ~H"""
    <div data-part="group" class={classes(["overflow-hidden text-foreground", @class])}>
      <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {@label}
      </div>
      <div data-part="group-items">
        {render_slot(@inner_block)}
      </div>
    </div>
    """
  end

  attr :value, :string, required: true
  attr :disabled, :boolean, default: false
  attr :class, :string, default: nil
  attr :rest, :global
  slot :inner_block, required: true

  def combobox_item(assigns) do
    ~H"""
    <div
      data-part="item"
      data-value={@value}
      data-disabled={@disabled}
      tabindex={if @disabled, do: "-1", else: "0"}
      class={
        classes([
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
          "focus:bg-accent focus:text-accent-foreground",
          "data-[highlighted=true]:bg-accent data-[highlighted=true]:text-accent-foreground",
          "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
          "data-[visible=false]:hidden",
          @class
        ])
      }
      {@rest}
    >
      <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <span data-part="item-indicator" hidden>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
          >
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
      </span>
      <span data-part="item-text">{render_slot(@inner_block)}</span>
    </div>
    """
  end

  defp get_animation_config do
    %{
      "open_to_closed" => %{
        duration: 130,
        target_part: "content"
      }
    }
  end
end
