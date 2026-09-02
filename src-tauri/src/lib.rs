use sysinfo::Disks;
use serde::Serialize;
use std::path::Path;
use bytesize::ByteSize;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // workaround for launch issues on linux cuz nvidia blows
    #[cfg(target_os = "linux")]
    std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_for_devices])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Clone, Serialize)]
pub struct Device {
    pub name: String,
    pub mount_point: String,
    pub total_gb: f64,
    pub avail_gb: f64
}

#[tauri::command]
fn scan_for_devices() -> Vec<Device> {
    println!("Scanning for Rockbox devices...");
    
    let mut results = Vec::new();
    let disks = Disks::new_with_refreshed_list();
    for disk in disks.list() {
        // get name & mount point (todo: test result on windows)
        let name = disk.name().to_string_lossy().to_string();
        let mount_point = disk.mount_point().to_string_lossy().to_string();

        // check for a .rockbox folder on root
        let rockbox_folder = Path::new(&mount_point).join(".rockbox");
        if !rockbox_folder.exists() {continue;} // not a rockbox device, keep going

        // get avail & total storage
        let total = disk.total_space();
        let avail = disk.available_space();
        let total_gb = (ByteSize::b(total).as_gb() * 10.0).round() / 10.0;
        let avail_gb = (ByteSize::b(avail).as_gb() * 10.0).round() / 10.0;

        // tmp for debugging
        println!("Look mom I found one!");
        println!(" >> Name: {}", name);
        println!(" >> Mount: {}", mount_point);
        println!(" >> Total: {}", total_gb.to_string());
        println!(" >> Avail: {}", avail_gb.to_string());

        results.push(Device {name, mount_point, total_gb, avail_gb});
    }

    results
}