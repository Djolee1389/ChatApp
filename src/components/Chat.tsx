import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPaperPlane } from "react-icons/fa6";
import {
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  Container,
  Paper,
  Box,
  Button,
  Typography,
  List,
  ListItem,
} from "@mui/material";

interface Message {
  id: string;
  text: string;
  sender: string;
  createdAt: any;
}

const Chat = () => {
  const { chatPath } = useParams<{ chatPath: string }>();

  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const participants = chatPath ? chatPath.split("-") : [];

  const currentUser = auth.currentUser;
  const currentUsername = currentUser?.displayName || "Anonymous";
  const recipientUsername = participants[1] || "Unknown";
  // console.log(participants)

  const chatId = [currentUsername, recipientUsername]
    .map((name) => name.replace(/\s+/g, "_"))
    .sort()
    .join("_");

  // Load messages
  useEffect(() => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    const textToSend = message.trim();
    setMessage("");

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: textToSend,
        sender: currentUsername,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 5, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Button
            variant="text"
            sx={{ mt: 2 }}
            onClick={() => navigate("/users")}
          >
            ←
          </Button>
          Chat with {recipientUsername}
        </Typography>

        <List
          sx={{
            maxHeight: 400,
            overflowY: "auto",
            mb: 2,
            "&::-webkit-scrollbar": { width: 0, background: "transparent" },
          }}
        >
          {messages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                justifyContent:
                  msg.sender === currentUsername ? "flex-end" : "flex-start",
                display: "flex",
              }}
            >
              <Box
                sx={{
                  bgcolor:
                    msg.sender === currentUsername ? "#1976d2" : "#e0e0e0",
                  color: msg.sender === currentUsername ? "white" : "black",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  display: "inline-block", // širina zavisi od sadržaja
                  maxWidth: "75%",
                }}
              >
                <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                  {msg.text}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color:
                      msg.sender === currentUsername
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(0,0,0,0.6)",
                    mt: 0.5,
                  }}
                >
                  <span>{msg.sender}</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>

        <Box
          component="form"
          onSubmit={handleSend}
          sx={{ display: "flex", gap: 1 }}
        >
          <input
            type="text"
            placeholder="Poruka"
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="message-button"
            disabled={!message.trim()}
          >
            <FaPaperPlane />
          </button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;
