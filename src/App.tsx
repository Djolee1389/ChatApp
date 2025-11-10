import { Select, MenuItem } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/LogIn";
import Signup from "./components/SignUp";
import Users from "./pages/Users";
import Chat from "./components/Chat";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";

function App({ setLocale }: { setLocale: (lang: "sr" | "en") => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const intl = useIntl();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading)
    return (
      <p style={{ fontSize: 40, color: "white" }}>
        {intl.formatMessage({
          id: "loading",
        })}
        ...
      </p>
    );

  return (
    <>
      <nav>
        <Select
          value={localStorage.getItem("locale") || "sr"}
          onChange={(e) => {
            const newLocale = e.target.value as "sr" | "en";
            setLocale(newLocale);
            localStorage.setItem("locale", newLocale);
          }}
          size="small"
          id="language"
          name="language"
          sx={{
            color: "white",
            border: "1px solid white",
            "& .MuiSelect-icon": { color: "white" },
          }}
        >
          <MenuItem id="language-sr" value="sr">
            SR
          </MenuItem>
          <MenuItem id="language-en" value="en">
            EN
          </MenuItem>
        </Select>
      </nav>

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
