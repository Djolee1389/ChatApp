import { useEffect, useState } from "react";
import { collection, getDocs} from "firebase/firestore";
import { auth, db } from "../firebase";
import { ListItem, List, ListItemText, Button, Avatar } from "@mui/material";
import { useIntl } from "react-intl";

interface User {
  uid: string;
  username: string;
  email: string;
  photoURL?: string;
}

export default function ActiveChats({
  handleChat,
}: {
  handleChat: (user: User) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const intl = useIntl();

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchActiveChatUsers = async () => {
      const currentUserId = auth.currentUser!.uid;
      const allUsersRef = collection(db, "users");
      const allUsersSnapshot = await getDocs(allUsersRef);

      const usersWithChats: User[] = [];

      for (const userDoc of allUsersSnapshot.docs) {
        const userId = userDoc.id;
        if (userId === currentUserId) continue;

        const userData = userDoc.data();
        const chatId = [currentUserId, userId].sort().join("-");

        const messagesRef = collection(db, "chats", chatId, "messages");
        const messagesSnapshot = await getDocs(messagesRef);

        if (messagesSnapshot.size > 0) {
          usersWithChats.push({
            uid: userId,
            username: userData.username || "",
            email: userData.email || "",
            photoURL: userData.photoURL || "",
          });
        }
      }

      setUsers(usersWithChats);
    };

    fetchActiveChatUsers();
  }, []);

  return (
    <List>
      {users.map((u) => (
        <ListItem key={u.uid} divider className="list-item">
          <Avatar src={u.photoURL} style={{ marginRight: "20px" }}></Avatar>
          <ListItemText primary={u.username} secondary={u.email} />
          <Button variant="outlined" onClick={() => handleChat(u)}>
            {intl.formatMessage({ id: "chat" })}
          </Button>
        </ListItem>
      ))}
    </List>
  );
}