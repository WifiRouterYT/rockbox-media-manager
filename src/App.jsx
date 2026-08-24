import { createSignal, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import {TopBar} from "./components/TopBar.jsx";

function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name: name() }));
  }

  function handleSearch(query) {
    console.log("searching for:", query);
  }

  function handleMenuAction(menuId, label) {
    console.log(`${menuId} → ${label}`);
  }

  // why is resizing a flexbox so hard??
  const [sidebarWidth, setSidebarWidth] = createSignal(200);
  const [isDragging, setIsDragging] = createSignal(false);

  const handleMouseMove = (e) => {
    if (!isDragging()) return;
    const newWidth = Math.max(100, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const startDrag = () => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  return (
    <main>
      <TopBar onSearch={handleSearch} onMenuAction={handleMenuAction}/>
      <div class="container">
        <div class="sidebar" style={{ width: `${sidebarWidth()}px` }}>
          <p>huh</p>
        </div>
        <div class="divider" onMouseDown={startDrag} />
        <div class="content">
          <p>yah</p>
        </div>
      </div>
    </main>
  );
}

export default App;
