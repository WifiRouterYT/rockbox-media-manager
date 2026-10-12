use ordered_float::OrderedFloat;
use serde::Serialize;

#[derive(Clone, Serialize, PartialEq, Eq, Default)]
pub struct Device {
    pub name: String,
    pub mount_point: String,
    pub total_gb: OrderedFloat<f64>,
    pub avail_gb: OrderedFloat<f64>,
    pub target: String,
    pub firm_ver: String
}

#[derive(PartialEq, Eq)]
pub struct DeviceMounts {
    pub name: String,
    pub mount_point: String,
    pub device: Option<Device>
}

#[derive(Default)]
pub struct AppState {
    pub device_list: Vec<DeviceMounts>
}