defmodule SaladUI.Sonner do
  @moduledoc """
  Toast notification system for SaladPocUi.

  ## Setup

  Add `<.toaster />` to your app layout (app.html.heex):

      <.toaster />

  ## Usage

  From LiveView:

      def handle_event("save", _params, socket) do
        {:noreply, push_toast(socket, :success, "Saved!")}
      end

  With options:

      push_toast(socket, :error, "Failed",
        description: "Please try again.",
        duration: 8000
      )

  ## Toast Types

  - `:default` - Neutral notification
  - `:success` - Green success message
  - `:info` - Blue informational message
  - `:warning` - Yellow warning message
  - `:error` - Red error message
  """
  use SaladUI, :component

  @doc """
  Renders the toast container.

  Place once in your app layout. Toasts will be rendered here.

  ## Attributes

  - `:id` - Container ID. Defaults to "toaster".
  - `:class` - Additional CSS classes.
  - `:duration` - Default auto-dismiss time in ms. Defaults to 4000.
  - `:max_toasts` - Max visible toasts. Defaults to 3.

  ## Example

      <.toaster />
      <.toaster duration={5000} max_toasts={5} />
  """
  attr :id, :string, default: "toaster"
  attr :class, :any, default: nil
  attr :duration, :integer, default: 4000
  attr :max_toasts, :integer, default: 3
  attr :gap, :integer, default: 8

  def toaster(assigns) do
    assigns =
      assign(
        assigns,
        :options,
        json(%{
          duration: assigns.duration,
          maxToasts: assigns.max_toasts,
          gap: assigns.gap
        })
      )

    ~H"""
    <div
      id={@id}
      data-component="sonner"
      data-options={@options}
      phx-hook="SaladUI"
      aria-live="polite"
      style="position: fixed; bottom: 1rem; right: 1rem; z-index: 100; width: 360px; display: flex; flex-direction: column; gap: 0.5rem;"
      class={classes([@class])}
    >
    </div>
    """
  end

  @doc """
  Push a toast notification from LiveView.

  ## Parameters

  - `socket` - LiveView socket
  - `type` - `:default`, `:success`, `:info`, `:warning`, or `:error`
  - `title` - Toast title/message
  - `opts` - Optional keyword list:
    - `:description` - Additional text
    - `:duration` - Auto-dismiss time in ms (0 = never)
    - `:id` - Custom toast ID

  ## Examples

      push_toast(socket, :success, "Saved!")

      push_toast(socket, :error, "Failed",
        description: "Check your connection.",
        duration: 10_000
      )
  """
  @spec push_toast(Phoenix.LiveView.Socket.t(), atom(), String.t(), keyword()) ::
          Phoenix.LiveView.Socket.t()
  def push_toast(socket, type, title, opts \\ []) do
    payload = %{
      id: Keyword.get(opts, :id, "toast-#{System.unique_integer([:positive])}"),
      type: to_string(type),
      title: title,
      description: Keyword.get(opts, :description),
      duration: Keyword.get(opts, :duration, 4000),
      dismissible: Keyword.get(opts, :dismissible, true)
    }

    Phoenix.LiveView.push_event(socket, "salad-ui:toast", payload)
  end
end
