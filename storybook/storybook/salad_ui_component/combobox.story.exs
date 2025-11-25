defmodule Storybook.SaladUIComponents.Combobox do
  @moduledoc """
  Storybook documentation for the SaladUI Combobox component.

  The Combobox component provides a searchable select dropdown.
  """
  use PhoenixStorybook.Story, :component

  def function, do: &SaladUI.Combobox.combobox/1

  def imports,
    do: [
      {SaladUI.Combobox,
       [
         combobox_group: 1,
         combobox_item: 1
       ]},
      {SaladUI.Button, [button: 1]}
    ]

  def description do
    """
    The Combobox component combines the features of a select dropdown with text input filtering,
    similar to shadcn/ui's Combobox component. It allows users to search and filter options
    while selecting from a dropdown list.
    """
  end

  def variations do
    [
      %Variation{
        id: :default_combobox,
        description: "A combobox component with default styling and behavior",
        attributes: %{
          id: "framework-select",
          placeholder: "Select framework..."
        },
        slots: [
          """
          <.combobox_item value="react">React</.combobox_item>
          <.combobox_item value="vue">Vue</.combobox_item>
          <.combobox_item value="angular">Angular</.combobox_item>
          <.combobox_item value="svelte">Svelte</.combobox_item>
          <.combobox_item value="solid">Solid</.combobox_item>
          """
        ]
      },
      %Variation{
        id: :with_default_value,
        description: "A combobox component with a pre-selected default value",
        attributes: %{
          id: "preset-combobox",
          placeholder: "Select framework...",
          value: "vue"
        },
        slots: [
          """
          <.combobox_item value="react">React</.combobox_item>
          <.combobox_item value="vue">Vue</.combobox_item>
          <.combobox_item value="angular">Angular</.combobox_item>
          <.combobox_item value="svelte">Svelte</.combobox_item>
          """
        ]
      },
      %Variation{
        id: :with_groups,
        description: "A combobox component with grouped items",
        attributes: %{
          id: "fruit-select",
          placeholder: "Select fruit..."
        },
        slots: [
          """
          <.combobox_group label="Citrus">
            <.combobox_item value="orange">Orange</.combobox_item>
            <.combobox_item value="lemon">Lemon</.combobox_item>
            <.combobox_item value="lime">Lime</.combobox_item>
          </.combobox_group>
          <.combobox_group label="Berries">
            <.combobox_item value="strawberry">Strawberry</.combobox_item>
            <.combobox_item value="blueberry">Blueberry</.combobox_item>
            <.combobox_item value="raspberry">Raspberry</.combobox_item>
          </.combobox_group>
          """
        ]
      },
      %Variation{
        id: :with_disabled_items,
        description: "A combobox component with some disabled items",
        attributes: %{
          id: "disabled-items-combobox",
          placeholder: "Select option..."
        },
        slots: [
          """
          <.combobox_item value="option1">Option 1</.combobox_item>
          <.combobox_item value="option2" disabled>Option 2 (Disabled)</.combobox_item>
          <.combobox_item value="option3">Option 3</.combobox_item>
          <.combobox_item value="option4" disabled>Option 4 (Disabled)</.combobox_item>
          """
        ]
      },
      %Variation{
        id: :disabled,
        description: "A disabled combobox component",
        attributes: %{
          id: "disabled-combobox",
          placeholder: "Select framework...",
          disabled: true
        },
        slots: [
          """
          <.combobox_item value="react">React</.combobox_item>
          <.combobox_item value="vue">Vue</.combobox_item>
          """
        ]
      },
      %Variation{
        id: :in_form,
        description: "A combobox component used within a form",
        attributes: %{
          id: "form-combobox",
          name: "framework",
          placeholder: "Select framework..."
        },
        template: """
        <form phx-change="validate" phx-submit="save" class="space-y-4">
          <div>
            <label for="form-combobox" class="block text-sm font-medium text-gray-700 mb-1">
              Select a framework
            </label>
            <.psb-variation />
          </div>
          <.button type="submit">Submit</.button>
        </form>
        """,
        slots: [
          """
          <.combobox_item value="react">React</.combobox_item>
          <.combobox_item value="vue">Vue</.combobox_item>
          <.combobox_item value="angular">Angular</.combobox_item>
          <.combobox_item value="svelte">Svelte</.combobox_item>
          """
        ]
      }
    ]
  end
end
