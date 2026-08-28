import { createSignal, For, Show, onCleanup, onMount } from "solid-js";
import "./TopBar.css";

// define da menus
const MENUS = [
  {
    id: "file",
    label: "File",
    items: [
      { label: "New Playlist", shortcut: "⌃N" },
      { label: "Add Files..." },
      { label: "Add Folder..." },
      { sep: true },
      { label: "Import Library…" },
      { label: "Export Playlist…" },
      { sep: true },
      { label: "Sync to Device", shortcut: "⌃S" },
      { sep: true },
      { label: "Quit", shortcut: "⌃Q" },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "⌃Z" },
      { label: "Redo", shortcut: "⇧⌃Z", disabled: true },
      { sep: true },
      { label: "Cut", shortcut: "⌃X" },
      { label: "Copy", shortcut: "⌃C" },
      { label: "Paste", shortcut: "⌃V" },
      { label: "Select All", shortcut: "⌃A" },
      { sep: true },
      { label: "Preferences", shortcut: "⌃," },
    ],
  },
  {
    id: "view",
    label: "View",
    items: [
      { label: "Library", shortcut: "⌃1" },
      { label: "Playlists", shortcut: "⌃2" },
      { label: "Device Browser", shortcut: "⌃3" },
      { sep: true },
      { label: "Show Album Art" },
      { label: "Show Sidebar", shortcut: "⌃\\" },
      { sep: true },
      { label: "Toggle Full Screen", shortcut: "⌃[shift]F" },
    ],
  },
  {
    id: "library",
    label: "Library",
    items: [
      { label: "Scan for Changes", shortcut: "⌃R" },
      { label: "Rebuild Database" },
      { sep: true },
      { label: "Find Duplicates" },
    ],
  },
  {
    id: "device",
    label: "Device",
    items: [
      { label: "No device connected", disabled: true },
      { sep: true },
      { label: "Rockbox Info" },
      { label: "Install Rockbox (soon™)", disabled: true },
      { label: "Update Firmware" },
      { sep: true },
      { label: "Rebuild .rockbox Database" },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      { label: "Rockbox Manual" },
      { label: "Keyboard Shortcuts", shortcut: "⌃/" },
      { sep: true },
      { label: "Report an Issue…" },
      { label: "About" },
    ],
  },
];

export function TopBar(props) {
  const [openMenu, setOpenMenu] = createSignal(null);
  const [query, setQuery] = createSignal("");
  let barRef;

  function handleDocClick(e) {
    if (barRef && !barRef.contains(e.target)) setOpenMenu(null);
  }
  function handleDocKey(e) {
    if (e.key === "Escape") setOpenMenu(null);
  }

  onMount(() => {
    document.addEventListener("click", handleDocClick);
    document.addEventListener("keydown", handleDocKey);
  });
  onCleanup(() => {
    document.removeEventListener("click", handleDocClick);
    document.removeEventListener("keydown", handleDocKey);
  });

  function handleItemClick(menuId, item) {
    if (item.disabled) return;
    setOpenMenu(null);
    props.onMenuAction?.(menuId, item.label);
  }

  function handleSearchInput(e) {
    const value = e.currentTarget.value;
    setQuery(value);
    props.onSearch?.(value);
  }

  return (
    <div class="topbar" ref={barRef}>
      <nav class="menubar">
        <For each={MENUS}>
          {(menu) => (
            <div class="menu" classList={{ open: openMenu() === menu.id }}>
              <button
                type="button"
                class="menu-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu((cur) => (cur === menu.id ? null : menu.id));
                }}
                onMouseEnter={() => {
                  setOpenMenu((cur) => (cur !== null ? menu.id : cur));
                }}
              >
                {menu.label}
              </button>

              <Show when={openMenu() === menu.id}>
                <div class="menu-dropdown">
                  <For each={menu.items}>
                    {(item) => (
                      <Show
                        when={!item.sep}
                        fallback={<div class="menu-separator" />}
                      >
                        <div
                          class="menu-item"
                          classList={{ disabled: item.disabled }}
                          onClick={() => handleItemClick(menu.id, item)}
                        >
                          <span>{item.label}</span>
                          <Show when={item.shortcut}>
                            <span class="shortcut">{item.shortcut}</span>
                          </Show>
                        </div>
                      </Show>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </nav>

      <div class="topbar-spacer" />

      <div class="search-field">
        <svg class="search-icon" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
          <path d="M11 11L14.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Search..."
          spellcheck={false}
          value={query()}
          onInput={handleSearchInput}
        />
      </div>
    </div>
  );
}