import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [darkMode, setDarkMode] = useState(null);

  useEffect(() => {
    let darkMode = localStorage.getItem("darkMode");
    if (darkMode === "enabled") enableDarkMode();
  }, []);

  const disableDarkMode = () => {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", null);
    setDarkMode(null);
  };

  const enableDarkMode = () => {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkMode", "enabled");
    setDarkMode("enabled");
  };

  const handleThemeToggle = () => {
    if (darkMode !== "enabled") {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  };

  return (
    <button className="btn" onClick={handleThemeToggle}>
      {darkMode ? "Dark" : "Light"}
    </button>
  );
}
