import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ListItem, List, ListItemText, Button, Avatar } from "@mui/material";
import { useIntl } from "react-intl";

interface User {
  uid: string;
  username: string;
  email: string;
  photoURL?: string;
}

export default function AllUsers({
  handleChat,
}: {
  handleChat: (user: User) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const intl = useIntl();

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

      setUsers(data.filter((u) => u.uid !== auth.currentUser?.uid));
    });

    return () => unsubscribe();
  }, []);

  return (
    <List>
      {users.map((u) => (
        <ListItem key={u.uid} divider className="list-item">
          <Avatar src={u.photoURL} style={{marginRight:"20px"}}></Avatar>
          <ListItemText primary={u.username} secondary={u.email} />
          <Button variant="outlined" onClick={() => handleChat(u)}>
            {intl.formatMessage({ id: "chat" })}
          </Button>
        </ListItem>
      ))}
    </List>
  );
}
