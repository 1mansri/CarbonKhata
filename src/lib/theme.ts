export const THEME_STORAGE_KEY = "theme";

/**
 * Runs inline in <head>, before first paint: resolves the reader's theme
 * (saved choice, else OS preference) so there is no light/dark flash.
 * Static string — no user input is interpolated.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
