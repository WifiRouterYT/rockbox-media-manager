use sysinfo::Disks;
use serde::Serialize;
use std::{path::Path, thread::sleep, time::Duration};
use bytesize::ByteSize;
use std::thread;

#[derive(Clone, Serialize)]
pub struct Device {
    pub name: String,
    pub mount_point: String,
    pub total_gb: f64,
    pub avail_gb: f64
}

#[tauri::command]
pub fn scan_for_devices() -> Vec<Device> {
    println!("Scanning for Rockbox devices...");
    
    let mut results = Vec::new();
    let disks = Disks::new_with_refreshed_list();
    for disk in disks.list() {
        // get name & mount point (todo: test result on windows)
        let name = disk.name().to_string_lossy().to_string();
        let mount_point = disk.mount_point().to_string_lossy().to_string();

        // check for a .rockbox folder on root
        let rockbox_folder = Path::new(&mount_point).join(".rockbox");
        if !rockbox_folder.exists() { continue; } // not a rockbox device, keep going

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

    // tmp
    if results.len() == 0 {
        println!("No Rockbox devices found.");
    }
    results
}

pub fn looper() {
    thread::spawn(|| {
        loop {
                println!("Iteration");
                scan_for_devices();

                sleep(Duration::from_secs(3));
        }
    });
}