use tauri::{
    image::Image,
    menu::{IconMenuItem, Menu},
    tray::TrayIconBuilder,
    LogicalSize, Manager, WindowEvent,
};
#[allow(unused_imports)]
use tauri_plugin_desktop_underlay::DesktopUnderlayExt;

#[tauri::command]
fn update_window_with_ratio(window: tauri::Window, width: f64, height: f64) {
    let _ = window.set_size(LogicalSize { width, height });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::ManagerExt;

                let autostart_manager = app.autolaunch();
                if let Err(e) = autostart_manager.enable() {
                    eprintln!("Failed to enable autostart: {}", e);
                }
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
            let icon = Image::from_bytes(icon_bytes).map_err(|_| {
                std::io::Error::new(std::io::ErrorKind::InvalidData, "Failed to load tray icon")
            })?;

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
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_desktop_underlay::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![update_window_with_ratio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
