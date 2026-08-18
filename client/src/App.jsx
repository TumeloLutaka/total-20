import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import io from "socket.io-client";
const socket = io.connect("http://localhost:5174");

import Home from "./components/Home/Home";
import Game from "./components/Game/Game";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    socket.on("update_users", (data) => {
      console.log(data);
      setData(data);
    });
  }, [data, socket]);

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
