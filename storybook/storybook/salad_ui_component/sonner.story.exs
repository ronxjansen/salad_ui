defmodule Storybook.SaladUIComponents.Sonner do
  @moduledoc false
  use PhoenixStorybook.Story, :example

  import SaladUI.Button
  import SaladUI.Sonner

  def doc do
    "Toast notification system. Click buttons to trigger different toast types."
  end

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="flex flex-col gap-8">
      <.toaster />

      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Toast Types</h3>
        <div class="flex flex-wrap gap-2">
          <.button phx-click="toast-default">Default</.button>
          <.button phx-click="toast-success" variant="outline" class="border-green-500 text-green-500">
            Success
          </.button>
          <.button phx-click="toast-info" variant="outline" class="border-blue-500 text-blue-500">
            Info
          </.button>
          <.button phx-click="toast-warning" variant="outline" class="border-yellow-500 text-yellow-500">
            Warning
          </.button>
          <.button phx-click="toast-error" variant="destructive">Error</.button>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-semibold">With Description</h3>
        <div class="flex flex-wrap gap-2">
          <.button phx-click="toast-with-description" variant="outline">
            Toast with Description
          </.button>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Custom Duration</h3>
        <div class="flex flex-wrap gap-2">
          <.button phx-click="toast-long-duration" variant="outline">
            Long Duration (10s)
          </.button>
          <.button phx-click="toast-short-duration" variant="outline">
            Short Duration (2s)
          </.button>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def handle_event("toast-default", _params, socket) do
    {:noreply, push_toast(socket, :default, "This is a default notification")}
  end

  def handle_event("toast-success", _params, socket) do
    {:noreply, push_toast(socket, :success, "Success! Your changes have been saved.")}
  end

  def handle_event("toast-info", _params, socket) do
    {:noreply, push_toast(socket, :info, "New update available")}
  end

  def handle_event("toast-warning", _params, socket) do
    {:noreply, push_toast(socket, :warning, "Your session is about to expire")}
  end

  def handle_event("toast-error", _params, socket) do
    {:noreply, push_toast(socket, :error, "Error! Something went wrong.")}
  end

  def handle_event("toast-with-description", _params, socket) do
    {:noreply,
     push_toast(socket, :success, "Event Created",
       description: "Your event has been scheduled for Monday, January 1st at 9:00 AM."
     )}
  end

  def handle_event("toast-long-duration", _params, socket) do
    {:noreply,
     push_toast(socket, :info, "This toast stays for 10 seconds",
       duration: 10_000
     )}
  end

  def handle_event("toast-short-duration", _params, socket) do
    {:noreply,
     push_toast(socket, :info, "Quick toast (2 seconds)",
       duration: 2000
     )}
  end
end
