import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
// import {auth} from "../firebase"
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useIntl } from "react-intl";
import { FaSignOutAlt, FaUser, FaPen } from "react-icons/fa";

import {
  Container,
  Button,
  Typography,
  Dialog,
  DialogContent,
  Avatar,
} from "@mui/material";
import EditProfile from "../components/EditProfile";

import { IconButton } from "@mui/material";
import ActiveChats from "../components/ActiveChats";
import AllUsers from "../components/AllUsers";

interface User {
  uid: string;
  username: string;
  email: string;
  photoURL?: string;
}

export default function Users() {
  const navigate = useNavigate();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"users" | "chats">("users");

  useEffect(() => {
    if (!auth.currentUser) return;

    const ref = collection(db, "users");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data: User[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          username: d.username || "",
          email: d.email || "",
          photoURL: d.photoURL || "",
        };
      });

      const me = data.find((u) => u.uid === auth.currentUser?.uid);
      setCurrentUserData(me || null);
    });

    return () => unsubscribe();
  }, []);

  const getChatPath = (user1: string, user2: string) => {
    return [user1, user2].join("-");
  };

  const handleLogout = async () => {
    const ok = confirm(
      intl.formatMessage({
        id: "logout.confirm",
      })
    );
    if (!ok) return;
    await signOut(auth);
    navigate("/login");
  };

  const handleChat = (user: User) => {
    if (!auth.currentUser) return;
    const currentUsername = auth.currentUser.displayName || "Unknown";
    const chatPath = getChatPath(currentUsername, user.username);
    navigate(`/chat/${chatPath}/${user.uid}`);
  };

  return (
    <Container
      sx={{ mt: 4, p: 5, minHeight: 500, width: 750 }}
      className="users-container"
    >
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setOpen(false);
        }}
      >
        <DialogContent>
          <EditProfile onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {currentUserData?.photoURL ? (
            <Avatar src={currentUserData.photoURL} />
          ) : (
            <FaUser style={{ color: "gray" }} />
          )}
          {currentUserData?.username || auth.currentUser?.displayName}
          <IconButton onClick={() => setOpen(true)}>
            <FaPen className="edit-pen" />
          </IconButton>
        </Typography>

        <Button onClick={handleLogout} sx={{ mb: 2 }}>
          {intl.formatMessage({
            id: "logout",
          })}{" "}
          <FaSignOutAlt style={{ marginLeft: "10px" }} />
        </Button>
      </div>
      <hr />

      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "space-evenly",
          marginTop: "10px",
        }}
      >
        {["users", "chats"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <span
              key={tab}
              onClick={() => setActiveTab(tab as "users" | "chats")}
              style={{
                cursor: "pointer",
                padding: "8px 0",
                position: "relative",
                transition: "color 0.3s",
              }}
            >
              {tab === "users" ? "All Users" : "Active Chats"}
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  backgroundColor: isActive ? "#1668c3" : "transparent",
                  transition: "background-color 0.3s",
                }}
              />
            </span>
          );
        })}
      </div>
      {activeTab === "users" ? (
        <AllUsers handleChat={handleChat} />
      ) : (
        <ActiveChats  handleChat={handleChat}/>
      )}
    </Container>
  );
}
