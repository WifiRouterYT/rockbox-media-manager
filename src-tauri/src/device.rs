use sysinfo::Disks;
use serde::Serialize;
use std::{path::Path, thread::sleep, time::Duration, fs::File, io::{self, BufRead}};
use bytesize::ByteSize;
use std::thread;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
pub struct Device {
    pub name: String,
    pub mount_point: String,
    pub total_gb: f64,
    pub avail_gb: f64,
    pub target: String,
    pub firm_ver: String
}

#[tauri::command]
pub fn scan_for_devices(app: AppHandle) -> Vec<Device> {
    //println!("Scanning for Rockbox devices...");
    
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

        // read the rockbox target/model + firm ver -- todo: dont read the file each iteration and exhaust the poor drive
        let mut target = String::from("Unknown");
        let mut firm_ver = String::from("Unknown");
        if let Ok(lines) = read_lines(Path::new(&mount_point).join(".rockbox").join("rockbox-info.txt")) {
            for line in lines.map_while(Result::ok) {
                if let Some((key, value)) = line.split_once(": ") {
                    match key {
                        "Target" => target = value.to_string(),
                        "Version" => firm_ver = value.to_string(),
                        _ => {}
                    }
                }
            }
        }

        // tmp for debugging
        /*println!("Look mom I found one!");
        println!(" >> Name: {}", name);
        println!(" >> Mount: {}", mount_point);
        println!(" >> Total: {}", total_gb.to_string());
        println!(" >> Avail: {}", avail_gb.to_string());*/

        results.push(Device {name, mount_point, total_gb, avail_gb, target, firm_ver});
    }

    // tmp
    if results.len() == 0 {
        println!("No Rockbox devices found.");
    }

    // todo: rather than emit every 3 seconds, only emit when there is a difference from previous results
    //       i.e. a new device is connected or device is disconnected
    //       bonus: read files off device only on new connection, not every loop to avoid stressing disk
    app.emit("device-found", &results).unwrap();
    results
}

pub fn looper(app: AppHandle) {
    thread::spawn(move || {
        loop {
                scan_for_devices(app.clone());

                sleep(Duration::from_secs(3));
        }
    });
}

fn read_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where P: AsRef<Path>, {
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}