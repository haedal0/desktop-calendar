use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{IconMenuItem, Menu, MenuItem},
    tray::TrayIconBuilder,
    window, Listener, LogicalSize, Manager, WindowEvent,
};
use tauri_plugin_desktop_underlay::DesktopUnderlayExt;

struct AppState {
    aspect_ratio: Mutex<f64>,
}

#[tauri::command]
fn change_window_size(window: tauri::Window, width: f64, height: f64) {
    window
        .set_size(LogicalSize {
            height: height,
            width: width,
        })
        .unwrap();
}

#[tauri::command]
fn update_window_with_ratio(
    window: tauri::Window,
    state: tauri::State<AppState>,
    width: f64,
    height: f64,
) {
    let mut ratio_lock = state.aspect_ratio.lock().unwrap();
    *ratio_lock = width / height;

    let _ = window.set_size(LogicalSize { width, height });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {}))
        .manage(AppState {
            aspect_ratio: Mutex::new(880.0 / 1000.0),
        })
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    None,
                ));

                let autostart_manager = app.autolaunch();
                let _ = autostart_manager.enable();
            }

            if let Some(window) = app.get_webview_window("main") {
                window.set_always_on_bottom(true)?;
            }

            if let Some(settings) = app.get_webview_window("settings") {
                let settings_clone = settings.clone();
                settings.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = settings_clone.hide();
                    }
                });
            }

            let icon_bytes = include_bytes!("../../static/icons/settings.png");
            let icon = Image::from_bytes(icon_bytes).unwrap();

            let setting =
                IconMenuItem::with_id(app, "setting", "설정", true, Some(icon), None::<&str>)?;
            let quit_i = IconMenuItem::with_id(app, "quit", "나가기", true, None, None::<&str>)?;
            let menu = Menu::with_items(app, &[&setting, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;

            Ok(())
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                println!("quit menu item was clicked");
                app.exit(0);
            }
            "setting" => {
                if let Some(window) = app.get_webview_window("settings") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {
                println!("menu item {:?} not handled", event.id);
            }
        })
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {}))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_desktop_underlay::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            change_window_size,
            update_window_with_ratio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
