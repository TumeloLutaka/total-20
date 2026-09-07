import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { socket } from "./services/socket.js";
import Game from "./components/Game/Game";
import Home from "./components/Home/Home";

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
