import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { io } from "socket.io-client";

import Game from "./components/Game/Game";
import Home from "./components/Home/Home";

// Vite env variable fallback
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const socket = io(SOCKET_URL, { autoConnect: true });

console.log(socket);

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    function handleUpdateUsers(newData) {
      setData(newData);
    }

    socket.on("update_users", handleUpdateUsers);

    // Clean up listener when unmounting
    return () => {
      socket.off("update_users", handleUpdateUsers);
    };
  }, []); // Run once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home data={data} socket={socket} />} />
        <Route
          path="/game-board/:matchKey"
          element={<Game socket={socket} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
