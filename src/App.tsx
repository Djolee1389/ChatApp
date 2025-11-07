import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./components/LogIn";
import Signup from "./components/SignUp";
import Users from "./pages/Users";
import Chat from "./components/Chat";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <nav>{!user ? <Link to={"/login"}>LogIn</Link> : "Chat"}</nav>
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={user ? "/users" : "/login"} />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/users" /> : <Login />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/users" /> : <Signup />}
          />
          <Route
            path="/users"
            element={user ? <Users /> : <Navigate to="/login" />}
          />
          <Route path="/chat/:chatPath" element={<Chat />}></Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
