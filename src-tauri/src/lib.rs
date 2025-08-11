use std::{fs, path::PathBuf};
use tauri_plugin_autostart::ManagerExt;
use serde::{Deserialize, Serialize};
use tauri::{Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_autostart::MacosLauncher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None
        ))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.app_handle().path().app_data_dir().unwrap();
            std::fs::create_dir_all(app_data_dir).expect("Failed to create app data directory");

            let autostart_manager = app.autolaunch();
            let _ = autostart_manager.enable();

            #[cfg(target_os = "windows")]
            {
                let webview_window = app.get_webview_window("main");
                let window = webview_window.unwrap();
                let _ = set_as_wallpaper_layer(&window);
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

#[cfg(target_os = "windows")]
fn set_as_wallpaper_layer(window: &tauri::WebviewWindow) -> windows::core::Result<()> {
    use windows::core::w;
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        FindWindowExW, FindWindowW, SendMessageTimeoutW, SetParent, SMTO_NORMAL,
    };

    unsafe {
        use windows::Win32::{
            Foundation::{LPARAM, WPARAM},
            UI::WindowsAndMessaging::{
                GetWindowLongW, SetLayeredWindowAttributes, SetWindowLongW, SetWindowPos,
                GWL_EXSTYLE, GWL_STYLE, HWND_TOPMOST, LWA_ALPHA, SWP_NOMOVE, SWP_NOSIZE,
                WS_EX_LAYERED, WS_EX_TOOLWINDOW, WS_EX_TRANSPARENT, WS_POPUP,
            },
        };
        let progman = FindWindowW(PCWSTR(w!("Progman").as_ptr()), PCWSTR::null())?;
        let mut dummy = 0usize;
        let _ = SendMessageTimeoutW(
            progman,
            0x052C,
            WPARAM(0),
            LPARAM(0),
            SMTO_NORMAL,
            1000,
            Some(&mut dummy as *mut usize),
        );
        let workerw = FindWindowExW(
            Some(progman),
            None,
            PCWSTR(w!("WorkerW").as_ptr()),
            PCWSTR::null(),
        )?;

        let _raw = window
            .hwnd()
            .or_else(|_| Err(windows::core::Error::from_win32()))?;
        let _raw_hwnd = window.hwnd().unwrap().0;

        let hwnd = HWND(window.hwnd().unwrap().0);

        let _ = SetParent(hwnd, Some(workerw));

        let exstyle = GetWindowLongW(hwnd, GWL_EXSTYLE);

        let new_exstyle = (exstyle | WS_EX_LAYERED.0 as i32)
            & !(WS_EX_TRANSPARENT.0 as i32 | WS_EX_TOOLWINDOW.0 as i32 | 0x08000000/* WS_EX_NOACTIVATE */);
        SetWindowLongW(hwnd, GWL_EXSTYLE, new_exstyle);

        let _ = SetLayeredWindowAttributes(
            hwnd,
            windows::Win32::Foundation::COLORREF(0),
            255,
            LWA_ALPHA,
        );

        let style = GetWindowLongW(hwnd, GWL_STYLE);
        if (style & WS_POPUP.0 as i32) == 0 {
            SetWindowLongW(hwnd, GWL_STYLE, style | WS_POPUP.0 as i32);
        }

        let _ = SetWindowPos(
            hwnd,
            Some(HWND_TOPMOST),
            0,
            0,
            0,
            0,
            SWP_NOMOVE | SWP_NOSIZE,
        );

        let _ = SetParent(hwnd, Some(progman));

        Ok(())
    }
}
