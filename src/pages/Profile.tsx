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
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Dialog,
  DialogContent,
  Avatar,
} from "@mui/material";
import EditProfile from "../components/EditProfile";

import { IconButton } from "@mui/material";

interface User {
  uid: string;
  username: string;
  email: string;
  photoURL?: string;
}

export default function Users() {
  const navigate = useNavigate();
  const intl = useIntl();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

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

      // all other users
      setUsers(data.filter((u) => u.uid !== auth.currentUser?.uid));

      // current user from Firestore
      const me = data.find((u) => u.uid === auth.currentUser?.uid);
      setCurrentUserData(me || null);
    });

    return () => unsubscribe();
  }, []);

  const getChatPath = (user1: string, user2: string) => {
    return [user1, user2].join("-");
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map(
        (doc) =>
          ({
            uid: doc.id,
            username: doc.data().username,
            email: doc.data().email,
          } as User)
      );
      setUsers(data.filter((u) => u.uid !== auth.currentUser?.uid));
    });

    return () => unsubscribe();
  }, []);

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
    <Container sx={{ mt: 4, p: 5, width: 750 }} className="users-container">
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

      <List>
        {users.map((u) => (
          <ListItem key={u.uid} divider className="list-item">
            <ListItemText primary={u.username} secondary={u.email} />
            <Button variant="outlined" onClick={() => handleChat(u)}>
              {intl.formatMessage({
                id: "chat",
              })}
            </Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
