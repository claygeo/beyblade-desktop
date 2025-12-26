#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct WindowRect {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
    title: String,
}

#[tauri::command]
fn get_open_windows() -> Vec<WindowRect> {
    // Window detection is platform-specific
    // For now, return empty - can be extended with platform APIs
    Vec::new()
}

#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_open_windows, exit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
