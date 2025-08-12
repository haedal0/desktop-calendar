use std::{fs, path::PathBuf};
use tauri_plugin_autostart::ManagerExt;
use serde::{Deserialize, Serialize};
use tauri::{Manager, PhysicalPosition, PhysicalSize, WebviewWindow};
use tauri_plugin_autostart::MacosLauncher;
use windows::Win32::{Foundation::{HWND, LPARAM, LRESULT, WPARAM}, UI::WindowsAndMessaging::{GetWindowLongPtrW, SetWindowLongPtrW, GWLP_WNDPROC}};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None
        ))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            set_window_below_icons,
            set_window_above_icons
        ])
        .setup(|app| {
            let app_data_dir = app.app_handle().path().app_data_dir().unwrap();
            std::fs::create_dir_all(app_data_dir).expect("Failed to create app data directory");

            let autostart_manager = app.autolaunch();
            let _ = autostart_manager.enable();

            #[cfg(target_os = "windows")]
            {
                let webview_window = app.get_webview_window("main");
                let window = webview_window.unwrap();
                set_window_below_icons(window.clone());
                let window_for_event = window.clone();
                window.on_window_event(move |event| {
                    use tauri::WindowEvent;

                    match event {
                        WindowEvent::Focused(false) => {
                            let _ = set_window_below_icons(window_for_event.clone());
                        }
                        _ => {}
                    }
                });

            }

            let app_data_dir = app.app_handle().path().app_data_dir().unwrap();
            let window_state = load_window_state(app_data_dir.join("window_state.json"));

            let window = app.get_webview_window("main").unwrap();
            if let Some(ws) = &window_state {
                window
                    .set_size(PhysicalSize::new(ws.width, ws.height))
                    .unwrap();
                window
                    .set_position(PhysicalPosition::new(ws.x, ws.y))
                    .unwrap();
            }

            let window_state = window_state.unwrap_or(WindowSize {
                width: 800,
                height: 600,
                x: 0,
                y: 0,
            });

            let window = window.clone();
            window.clone().on_window_event(move |event| {
                let mut position = PhysicalPosition::new(window_state.x, window_state.y);
                let mut size = PhysicalSize::new(window_state.width, window_state.height);
                if let tauri::WindowEvent::Resized(new_size) = event {
                    size = *new_size;
                    save_window_state(&position, &size, app_data_dir.join("window_state.json"));
                }
                if let tauri::WindowEvent::Moved(new_position) = event {
                    position = *new_position;
                    save_window_state(&position, &size, app_data_dir.join("window_state.json"));
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct WindowSize {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
}

fn load_window_state(path: PathBuf) -> Option<WindowSize> {
    if path.exists() {
        let data = fs::read_to_string(path).ok()?;
        serde_json::from_str(&data).ok()
    } else {
        None
    }
}

fn save_window_state(position: &PhysicalPosition<i32>, size: &PhysicalSize<u32>, path: PathBuf) {
    let ws = WindowSize {
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
    };
    if let Ok(data) = serde_json::to_string(&ws) {
        let _ = fs::write(path, data);
    }
}

#[cfg(windows)]
mod winapi {
    use windows::{
        Win32::Foundation::HWND,
        Win32::UI::WindowsAndMessaging::*,
    };

    pub unsafe fn set_window_pos(hwnd: HWND, top: bool) {
        SetWindowPos(
            hwnd,
            if top { Some(HWND_TOP) } else { Some(HWND_BOTTOM) },
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW,
        );
    }

}

#[tauri::command]
fn set_window_below_icons(window: WebviewWindow) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::Foundation::HWND;

        let hwnd = HWND(window.hwnd().unwrap().0);
        winapi::set_window_pos(hwnd, false);
    }
    Ok(())
}

#[tauri::command]
fn set_window_above_icons(window: WebviewWindow) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::Foundation::HWND;

        let hwnd = HWND(window.hwnd().unwrap().0);
        winapi::set_window_pos(hwnd, true);
    }
    Ok(())
}