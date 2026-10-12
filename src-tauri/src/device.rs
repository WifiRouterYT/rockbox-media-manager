use sysinfo::{Disks, DiskRefreshKind};
use std::{path::Path, thread::sleep, time::Duration, fs::File, io::{self, BufRead}};
use bytesize::ByteSize;
use std::thread;
use tauri::{AppHandle, Emitter, Manager};
use std::sync::Mutex;
use ordered_float::OrderedFloat;

use crate::appstate;

#[tauri::command]
pub fn scan_for_devices(app: AppHandle, refresh: bool) -> Vec<appstate::Device> {
    let state = app.state::<Mutex<appstate::AppState>>();
    let mut disks = Disks::new_with_refreshed_list_specifics(DiskRefreshKind::nothing());
    let mut state = state.lock().unwrap();

    // snapshot before any changes so we can detect differences at the end
    let before: Vec<appstate::Device> = state.device_list
        .iter()
        .filter_map(|dm| dm.device.clone())
        .collect();

    // if full refresh specified, clear the cached device list and repopulate it
    if refresh {
        state.device_list.clear();
    }

    let mut found_devices: Vec<appstate::DeviceMounts> = Vec::new();
    for disk in disks.list_mut() {
        let name = disk.name().to_string_lossy().to_string();
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        found_devices.push(appstate::DeviceMounts {name: name.clone(), mount_point: mount_point.clone(), device: None});

        // already known (rockbox or not)? skip!
        let found: bool = state.device_list.iter().any(|device| device.name.eq(&name)
                                                        & device.mount_point.eq(&mount_point));
        if found {continue;}

        // check for a .rockbox folder on root
        let rockbox_folder = Path::new(&mount_point).join(".rockbox");
        if !rockbox_folder.exists() {
            // this isn't a rockbox device...
            state.device_list.push(appstate::DeviceMounts { name, mount_point, device: None });
            continue;
        }

        // now (and only now) query storage for this disk
        disk.refresh_specifics(DiskRefreshKind::nothing().with_storage());
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

        let device: appstate::Device = appstate::Device 
            {name: name.clone(), mount_point: mount_point.clone(), total_gb: OrderedFloat(total_gb.clone()), 
             avail_gb: OrderedFloat(avail_gb.clone()), target: target.clone(), firm_ver: firm_ver.clone()};

        // save this drive to appstate
        state.device_list.push(appstate::DeviceMounts { name: name.clone(), mount_point: mount_point.clone(), device: Some(device.clone()) });

        // tmp for debugging
        println!("Look mom I found one!");
        println!(" >> Name: {}", name);
        println!(" >> Mount: {}", mount_point);
        println!(" >> Total: {}", total_gb.to_string());
        println!(" >> Avail: {}", avail_gb.to_string());

        //results.push(appstate::Device {name, mount_point, total_gb: OrderedFloat(total_gb), 
        //                               avail_gb: OrderedFloat(avail_gb), target, firm_ver});
    }

    // remove devices no longer connected from appstate
    state.device_list.retain(|device| {
        found_devices.iter().any(|fd| {
            fd.name == device.name && fd.mount_point == device.mount_point
        })
    });

    let devices: Vec<appstate::Device> = state.device_list
        .iter()
        .filter_map(|dm| dm.device.clone())
        .collect();

    if devices != before {
        app.emit("device-found", &devices).unwrap();
    }
    devices
    //app.emit("device-found", &results).unwrap();
    //results
}

pub fn looper(app: AppHandle) {
    thread::spawn(move || {
        loop {
            scan_for_devices(app.clone(), false);
            sleep(Duration::from_secs(3));
        }
    });
}

fn read_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where P: AsRef<Path>, {
    let file = File::open(filename)?;
    Ok(io::BufReader::new(file).lines())
}