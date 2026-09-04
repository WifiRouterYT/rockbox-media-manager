import { createSignal, For, Show, onCleanup, onMount, createEffect } from "solid-js";
import "./TopBar.css";

import { listen } from '@tauri-apps/api/event';

// define da menus
var MENUS = [
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
      {
        label: "View",
        submenu: [
          { label: "List", radioGroup: "view", value: "list" },
          { label: "Grid", radioGroup: "view", value: "grid" },
          { label: "Compact", radioGroup: "view", value: "compact" },
        ],
      },
      {
        label: "Sort By",
        submenu: [
          { label: "Artist", radioGroup: "sort", value: "artist" },
          { label: "Album", radioGroup: "sort", value: "album" },
          { label: "Year", radioGroup: "sort", value: "year" },
          { label: "Date Added", radioGroup: "sort", value: "date_added" },
          { label: "Genre", radioGroup: "sort", value: "genre" },
        ],
      },
      {
        label: "Group By",
        submenu: [
          { label: "No Grouping", radioGroup: "group", value: "none" },
          { label: "Artist", radioGroup: "group", value: "artist" },
          { label: "Album Artist", radioGroup: "group", value: "album" },
          { label: "Year", radioGroup: "group", value: "year" },
          { label: "Decade", radioGroup: "group", value: "decade" },
          { label: "Date Added", radioGroup: "group", value: "date_added" },
          { label: "Genre", radioGroup: "group", value: "genre" },
        ],
      },
      { sep: true },
      { label: "Scan for Changes", shortcut: "⌃R" },
      { label: "Rebuild Database" },
      { sep: true },
      { label: "Find Duplicates" },
    ],
  },
  { // 5
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
  const [openSubmenu, setOpenSubmenu] = createSignal(null);
  const [query, setQuery] = createSignal("");
  const [viewMode, setViewMode] = createSignal("grid");
  const [sortMode, setSortMode] = createSignal("artist");
  const [groupMode, setGroupMode] = createSignal("date_added");
  let barRef;

  // device info
  const [connectedDevice, setConnectedDevice] = createSignal(null);

  listen('device-found', (event) => {
    setConnectedDevice(event.payload);
  });

  createEffect(() => {
    /* 
    pub struct Device {
      pub name: String,
      pub mount_point: String,
      pub total_gb: f64,
      pub avail_gb: f64,
      pub target: String,
      pub firm_ver: String
    }
    */
   
  })

  // maps a radioGroup name -> [getter, setter, prop callback name]
  const RADIO_STATE = {
    view: [viewMode, setViewMode, "onViewChange"],
    sort: [sortMode, setSortMode, "onSortChange"],
    group: [groupMode, setGroupMode, "onGroupChange"],
  };

  function subKey(menuId, label) {
    return `${menuId}:${label}`;
  }

  function isChecked(sub) {
    const [get] = RADIO_STATE[sub.radioGroup];
    return get() === sub.value;
  }

  function openTopMenu(id) {
    setOpenMenu(id);
    setOpenSubmenu(null);
  }

  function handleDocClick(e) {
    if (barRef && !barRef.contains(e.target)) {
      setOpenMenu(null);
      setOpenSubmenu(null);
    }
  }
  function handleDocKey(e) {
    if (e.key === "Escape") {
      setOpenMenu(null);
      setOpenSubmenu(null);
    }
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
    setOpenSubmenu(null);
    props.onMenuAction?.(menuId, item.label);
  }

  function handleSubmenuItemClick(sub) {
    const [, setter, cbName] = RADIO_STATE[sub.radioGroup];
    setter(sub.value);
    props[cbName]?.(sub.value);
    setOpenMenu(null);
    setOpenSubmenu(null);
  }

  function handleSearchInput(e) {
    const value = e.currentTarget.value;
    setQuery(value);
    props.onSearch?.(value);
  }

  /* god this SUCKS!!! */
  return (
    <div class="topbar" ref={barRef}>
      <nav class="menubar">
        <For each={MENUS}>
          {(menu) => (
            <div class="menu" classList={{ open: openMenu() === menu.id }}>
              <button type="button" class="menu-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSubmenu(null);
                  setOpenMenu((cur) => (cur === menu.id ? null : menu.id));
                }}
                onMouseEnter={() => {
                  setOpenMenu((cur) => (cur !== null ? menu.id : cur));
                  setOpenSubmenu(null);
                }}
              >{menu.label}</button>

              <Show when={openMenu() === menu.id}>
                <div class="menu-dropdown">
                  <For each={menu.items}>
                    {(item) => (
                      <Show when={!item.sep} fallback={<div class="menu-separator" />}>
                        <Show when={item.submenu} fallback={
                            <div class="menu-item" classList={{ disabled: item.disabled }}
                              onMouseEnter={() => setOpenSubmenu(null)}
                              onClick={() => handleItemClick(menu.id, item)}
                            >
                              <span>{item.label}</span>
                              <Show when={item.shortcut}>
                                <span class="shortcut">{item.shortcut}</span>
                              </Show>
                            </div>
                          }
                        >
                          <div class="menu-item submenu-trigger" classList={{ open: openSubmenu() === subKey(menu.id, item.label) }} onMouseEnter={() => setOpenSubmenu(subKey(menu.id, item.label))}>
                            <span>{item.label}</span>
                            <span class="shortcut">›</span>

                            <Show when={openSubmenu() === subKey(menu.id, item.label)}>
                              <div class="menu-dropdown submenu-dropdown">
                                <For each={item.submenu}>
                                  {(sub) => (
                                    <div class="menu-item" onClick={() => handleSubmenuItemClick(sub)}>
                                      <span>
                                        <span class="check">{isChecked(sub) ? "•" : ""}</span>
                                        {sub.label}
                                      </span>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </Show>
                          </div>
                        </Show>
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